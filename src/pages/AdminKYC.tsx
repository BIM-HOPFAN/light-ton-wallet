import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useRoles } from '@/hooks/useRoles';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface KYCRecord {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string;
  bvn?: string;
  id_number?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export default function AdminKYC() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin, isModerator } = useRoles();
  const [selectedKYC, setSelectedKYC] = useState<KYCRecord | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: kycRecords = [], isLoading } = useQuery({
    queryKey: ['admin-kyc-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as KYCRecord[];
    },
    enabled: isAdmin || isModerator,
  });

  const updateKYCStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('kyc_records')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-kyc-records'] });
      toast.success('KYC status updated successfully');
      setShowRejectDialog(false);
      setSelectedKYC(null);
      setRejectionReason('');
    },
    onError: () => {
      toast.error('Failed to update KYC status');
    },
  });

  if (!isAdmin && !isModerator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <XCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access this page.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const pendingRecords = kycRecords.filter(r => r.status === 'pending');
  const approvedRecords = kycRecords.filter(r => r.status === 'approved');
  const rejectedRecords = kycRecords.filter(r => r.status === 'rejected');

  const handleApprove = (record: KYCRecord) => {
    updateKYCStatus.mutate({ id: record.id, status: 'approved' });
  };

  const handleReject = (record: KYCRecord) => {
    setSelectedKYC(record);
    setShowRejectDialog(true);
  };

  const confirmReject = () => {
    if (!selectedKYC) return;
    updateKYCStatus.mutate({ id: selectedKYC.id, status: 'rejected' });
  };

  const KYCCard = ({ record }: { record: KYCRecord }) => (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">{record.full_name}</h3>
          <p className="text-sm text-muted-foreground">{record.phone_number}</p>
        </div>
        <Badge
          variant={
            record.status === 'approved'
              ? 'default'
              : record.status === 'rejected'
              ? 'destructive'
              : 'secondary'
          }
        >
          {record.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
          {record.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
          {record.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
          {record.status.toUpperCase()}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        {record.bvn && (
          <div>
            <span className="text-muted-foreground">BVN: </span>
            <span className="font-mono">{record.bvn}</span>
          </div>
        )}
        {record.id_number && (
          <div>
            <span className="text-muted-foreground">ID Number: </span>
            <span className="font-mono">{record.id_number}</span>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Submitted: </span>
          <span>{new Date(record.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {record.status === 'pending' && (
        <div className="flex gap-2 mt-4">
          <Button
            className="flex-1"
            variant="default"
            onClick={() => handleApprove(record)}
            disabled={updateKYCStatus.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
          <Button
            className="flex-1"
            variant="destructive"
            onClick={() => handleReject(record)}
            disabled={updateKYCStatus.isPending}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
        </div>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">KYC Verification Management</h1>

        <Tabs defaultValue="pending">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              Pending ({pendingRecords.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approvedRecords.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedRecords.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 mt-4">
            {isLoading ? (
              <Card className="p-8 text-center">
                <p>Loading...</p>
              </Card>
            ) : pendingRecords.length === 0 ? (
              <Card className="p-8 text-center">
                <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No pending KYC submissions</p>
              </Card>
            ) : (
              pendingRecords.map(record => <KYCCard key={record.id} record={record} />)
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4 mt-4">
            {approvedRecords.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No approved records</p>
              </Card>
            ) : (
              approvedRecords.map(record => <KYCCard key={record.id} record={record} />)
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4 mt-4">
            {rejectedRecords.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No rejected records</p>
              </Card>
            ) : (
              rejectedRecords.map(record => <KYCCard key={record.id} record={record} />)
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this KYC application.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectionReason.trim() || updateKYCStatus.isPending}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
