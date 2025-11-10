import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch current TON prices from CoinGecko
    const priceResponse = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=toncoin&vs_currencies=usd,eur,gbp,jpy,rub,ngn'
    );
    
    if (!priceResponse.ok) {
      throw new Error('Failed to fetch prices');
    }

    const priceData = await priceResponse.json();
    const prices = {
      USD: priceData.toncoin.usd,
      EUR: priceData.toncoin.eur,
      GBP: priceData.toncoin.gbp,
      JPY: priceData.toncoin.jpy,
      RUB: priceData.toncoin.rub,
      NGN: priceData.toncoin.ngn,
    };

    // Fetch all active price alerts
    const { data: alerts, error: alertsError } = await supabaseClient
      .from('price_alerts')
      .select('*')
      .eq('is_active', true)
      .is('triggered_at', null);

    if (alertsError) {
      throw alertsError;
    }

    let triggeredCount = 0;

    // Check each alert
    for (const alert of alerts || []) {
      const currentPrice = prices[alert.currency as keyof typeof prices];
      const targetPrice = parseFloat(alert.target_price);
      
      let shouldTrigger = false;
      
      if (alert.condition === 'above' && currentPrice >= targetPrice) {
        shouldTrigger = true;
      } else if (alert.condition === 'below' && currentPrice <= targetPrice) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        // Update alert as triggered
        await supabaseClient
          .from('price_alerts')
          .update({
            triggered_at: new Date().toISOString(),
            is_active: false,
          })
          .eq('id', alert.id);

        // In a production app, you would send a push notification here
        // For now, we'll just log it
        console.log(`Alert triggered for user ${alert.user_id}: TON ${alert.condition} ${targetPrice} ${alert.currency}`);
        
        triggeredCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: alerts?.length || 0,
        triggered: triggeredCount,
        prices,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
