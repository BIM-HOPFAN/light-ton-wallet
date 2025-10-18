import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ShoppingBag, Shield, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProtectedFeature } from '@/components/ProtectedFeature';
import { useAuth } from '@/contexts/AuthContext';

interface Product {
  id: string;
  title: string;
  description: string;
  price_bimcoin: number;
  price_naira: number;
  category: string;
  images: any;
  stock_quantity: number;
  seller_id: string;
}

export default function ProductDetail() {
  return (
    <ProtectedFeature featureName="Product Details">
      <ProductDetailContent />
    </ProtectedFeature>
  );
}

function ProductDetailContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [buyerNotes, setBuyerNotes] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Product not found');
      navigate('/shop');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!product || !deliveryAddress.trim()) {
      toast.error('Please provide a delivery address');
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const totalBimcoin = (product.price_bimcoin * quantity).toFixed(8);

      // Create order with escrow
      const { data: order, error } = await supabase
        .from('orders')
        .insert([{
          buyer_id: user.id,
          seller_id: product.seller_id,
          product_id: product.id,
          quantity,
          total_bimcoin: parseFloat(totalBimcoin),
          delivery_address: deliveryAddress,
          buyer_notes: buyerNotes,
          status: 'escrow_locked'
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Order placed! Bimcoin locked in escrow', {
        description: 'Your payment is secured until delivery is confirmed'
      });

      navigate('/my-orders');
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to create order');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!product) return null;

  const totalPrice = (product.price_bimcoin * quantity).toFixed(2);
  const totalNaira = product.price_naira ? (product.price_naira * quantity).toFixed(2) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate('/shop')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shop
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div>
            <div className="aspect-square bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <Package className="h-32 w-32 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
              <Badge variant="secondary" className="capitalize">{product.category}</Badge>
            </div>

            <div>
              <div className="text-4xl font-bold text-primary mb-2">
                {product.price_bimcoin.toFixed(2)} BIM
              </div>
              {product.price_naira && (
                <div className="text-lg text-muted-foreground">
                  ≈ ₦{product.price_naira.toFixed(2)}
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium">Escrow Protected</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Your Bimcoin is locked in a smart contract until you confirm delivery. 
                Safe for buyers and sellers.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={product.stock_quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock_quantity, parseInt(e.target.value) || 1)))}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {product.stock_quantity} available
                </p>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => setShowCheckout(true)}
                disabled={product.stock_quantity === 0}
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Buy with Escrow Protection
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Purchase</DialogTitle>
            <DialogDescription>
              Your Bimcoin will be secured in escrow until delivery
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Item Total</span>
                <span className="font-semibold">{totalPrice} BIM</span>
              </div>
              {totalNaira && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Approx.</span>
                  <span>₦{totalNaira}</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="address">Delivery Address *</Label>
              <Textarea
                id="address"
                placeholder="Enter your complete delivery address..."
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes to Seller (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions..."
                value={buyerNotes}
                onChange={(e) => setBuyerNotes(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>

            <div className="bg-primary/10 p-3 rounded-lg flex gap-2">
              <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-medium mb-1">Escrow Process:</p>
                <p className="text-muted-foreground">
                  1. Your {totalPrice} BIM is locked in escrow<br/>
                  2. Seller ships your item<br/>
                  3. You confirm delivery<br/>
                  4. Funds release to seller
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Cancel
            </Button>
            <Button onClick={handlePurchase} disabled={processing || !deliveryAddress.trim()}>
              {processing ? 'Processing...' : `Lock ${totalPrice} BIM in Escrow`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}