import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, ArrowLeft, CheckCircle, Clock, Truck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProtectedFeature } from '@/components/ProtectedFeature';
import { useAuth } from '@/contexts/AuthContext';

interface Order {
  id: string;
  product_id: string;
  seller_id: string;
  quantity: number;
  total_bimcoin: number;
  status: string;
  delivery_address: string;
  tracking_number: string;
  created_at: string;
  products: {
    title: string;
    images: any;
  };
}

export default function MyOrders() {
  return (
    <ProtectedFeature featureName="My Orders">
      <MyOrdersContent />
    </ProtectedFeature>
  );
}

function MyOrdersContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch buyer orders
      const { data: buyerData, error: buyerError } = await supabase
        .from('orders')
        .select('*, products(title, images)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (buyerError) throw buyerError;
      setBuyerOrders(buyerData || []);

      // Fetch seller orders
      const { data: sellerData, error: sellerError } = await supabase
        .from('orders')
        .select('*, products(title, images)')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (sellerError) throw sellerError;
      setSellerOrders(sellerData || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelivery = async () => {
    if (!selectedOrder) return;

    try {
      // Get seller's current balance or create if doesn't exist
      const { data: sellerBalance, error: sellerBalanceError } = await supabase
        .from('bimcoin_balances')
        .select('balance')
        .eq('user_id', selectedOrder.seller_id)
        .maybeSingle();

      let newSellerBalance = selectedOrder.total_bimcoin;
      
      if (sellerBalance) {
        newSellerBalance = parseFloat(sellerBalance.balance.toString()) + selectedOrder.total_bimcoin;
      }

      // Release escrow to seller
      const { error: releaseError } = await supabase
        .from('bimcoin_balances')
        .upsert([{
          user_id: selectedOrder.seller_id,
          balance: newSellerBalance
        }]);

      if (releaseError) throw releaseError;

      // Update order status
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          delivery_confirmed_at: new Date().toISOString(),
          escrow_released_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      toast.success('Delivery confirmed!', {
        description: `${selectedOrder.total_bimcoin} BIM released to seller`
      });
      setShowConfirm(false);
      fetchOrders();
    } catch (error) {
      console.error('Error confirming delivery:', error);
      toast.error('Failed to confirm delivery');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'escrow_locked': return <Package className="h-4 w-4" />;
      case 'in_transit': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'disputed': return <AlertCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_transit': return 'bg-blue-500';
      case 'escrow_locked': return 'bg-yellow-500';
      case 'disputed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const renderOrder = (order: Order, isBuyer: boolean) => (
    <Card key={order.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded flex items-center justify-center flex-shrink-0">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold">{order.products?.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Qty: {order.quantity} • {order.total_bimcoin} BIM
                </p>
              </div>
              <Badge variant="outline" className="capitalize">
                {getStatusIcon(order.status)}
                <span className="ml-1">{order.status.replace('_', ' ')}</span>
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <span>{new Date(order.created_at).toLocaleDateString()}</span>
              {order.tracking_number && (
                <>
                  <span>•</span>
                  <span>Tracking: {order.tracking_number}</span>
                </>
              )}
            </div>

            {/* Order Timeline */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`h-2 w-2 rounded-full ${getStatusColor('escrow_locked')}`} />
              <div className="h-0.5 flex-1 bg-muted" />
              <div className={`h-2 w-2 rounded-full ${order.status === 'in_transit' || order.status === 'delivered' || order.status === 'completed' ? getStatusColor('in_transit') : 'bg-muted'}`} />
              <div className="h-0.5 flex-1 bg-muted" />
              <div className={`h-2 w-2 rounded-full ${order.status === 'delivered' || order.status === 'completed' ? getStatusColor('delivered') : 'bg-muted'}`} />
              <div className="h-0.5 flex-1 bg-muted" />
              <div className={`h-2 w-2 rounded-full ${order.status === 'completed' ? getStatusColor('completed') : 'bg-muted'}`} />
            </div>

            {isBuyer && order.status === 'delivered' && (
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => {
                  setSelectedOrder(order);
                  setShowConfirm(true);
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Delivery & Release Escrow
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/shop')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shop
        </Button>

        <h1 className="text-3xl font-bold mb-6">My Orders</h1>

        <Tabs defaultValue="buying">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="buying">
              Buying ({buyerOrders.length})
            </TabsTrigger>
            <TabsTrigger value="selling">
              Selling ({sellerOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buying">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-20 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : buyerOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No orders yet</h3>
                  <p className="text-muted-foreground mb-4">Start shopping with escrow protection</p>
                  <Button onClick={() => navigate('/shop')}>
                    Browse Products
                  </Button>
                </CardContent>
              </Card>
            ) : (
              buyerOrders.map(order => renderOrder(order, true))
            )}
          </TabsContent>

          <TabsContent value="selling">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-20 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : sellerOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No sales yet</h3>
                  <p className="text-muted-foreground">Your sales will appear here</p>
                </CardContent>
              </Card>
            ) : (
              sellerOrders.map(order => renderOrder(order, false))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirm Delivery Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delivery</DialogTitle>
            <DialogDescription>
              Have you received your order in good condition?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-primary/10 p-4 rounded-lg">
            <p className="text-sm mb-2">
              By confirming, you agree that:
            </p>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>✓ You have received the item</li>
              <li>✓ The item matches the description</li>
              <li>✓ {selectedOrder?.total_bimcoin} BIM will be released from escrow to the seller</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={confirmDelivery}>
              Confirm & Release Escrow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}