import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@/contexts/WalletContext';

interface NFT {
  id: string;
  name?: string;
  description?: string;
  image_url?: string;
  collection_name?: string;
  nft_address: string;
}

export default function NFTGallery() {
  const navigate = useNavigate();
  const { wallet } = useWallet();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    try {
      const { data, error } = await supabase
        .from('nft_collection')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNfts(data || []);
    } catch (error) {
      console.error('Error loading NFTs:', error);
      toast.error('Failed to load NFTs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">NFT Gallery</h1>

        {loading ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Loading NFTs...</p>
          </Card>
        ) : nfts.length === 0 ? (
          <Card className="p-8 text-center">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No NFTs found</p>
            <p className="text-sm text-muted-foreground mt-2">
              NFTs owned by this wallet will appear here
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nfts.map((nft) => (
              <Card key={nft.id} className="overflow-hidden hover:shadow-glow transition-smooth cursor-pointer">
                <div className="aspect-square bg-muted flex items-center justify-center">
                  {nft.image_url ? (
                    <img
                      src={nft.image_url}
                      alt={nft.name || 'NFT'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-16 w-16 text-muted-foreground" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold truncate">{nft.name || 'Unnamed NFT'}</h3>
                  {nft.collection_name && (
                    <p className="text-sm text-muted-foreground truncate">{nft.collection_name}</p>
                  )}
                  {nft.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {nft.description}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
