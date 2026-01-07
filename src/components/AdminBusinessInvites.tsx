import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Building2, Check, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface BusinessInvite {
  id: string;
  code: string;
  business_name: string;
  business_email: string | null;
  is_claimed: boolean;
  claimed_at: string | null;
  claimed_by: string | null;
  created_at: string;
}

export const AdminBusinessInvites = () => {
  const [invites, setInvites] = useState<BusinessInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newBusinessName, setNewBusinessName] = useState("");
  const [newBusinessEmail, setNewBusinessEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    try {
      const { data, error } = await supabase
        .from("business_invites")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (error) {
      console.error("Error loading invites:", error);
    } finally {
      setLoading(false);
    }
  };

  const createInvite = async () => {
    if (!newCode.trim() || !newBusinessName.trim()) {
      toast({
        title: t("admin.inviteError"),
        description: t("admin.inviteRequiredFields"),
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("business_invites")
        .insert({
          code: newCode.trim().toUpperCase(),
          business_name: newBusinessName.trim(),
          business_email: newBusinessEmail.trim() || null,
          created_by: user?.id,
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: t("admin.inviteError"),
            description: t("admin.inviteCodeExists"),
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: t("admin.inviteCreated"),
        description: t("admin.inviteCreatedDesc"),
      });

      setNewCode("");
      setNewBusinessName("");
      setNewBusinessEmail("");
      setIsDialogOpen(false);
      loadInvites();
    } catch (error) {
      console.error("Error creating invite:", error);
      toast({
        title: t("admin.inviteError"),
        description: t("admin.inviteErrorDesc"),
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteInvite = async (id: string) => {
    try {
      const { error } = await supabase
        .from("business_invites")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: t("admin.inviteDeleted"),
      });
      loadInvites();
    } catch (error) {
      console.error("Error deleting invite:", error);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: t("admin.codeCopied"),
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t("admin.businessInvites")}
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t("admin.createInvite")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("admin.createBusinessAccount")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="code">{t("admin.inviteCode")}</Label>
                  <Input
                    id="code"
                    placeholder={t("admin.inviteCodePlaceholder")}
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    maxLength={20}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("admin.inviteCodeHelp")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessName">{t("admin.businessName")}</Label>
                  <Input
                    id="businessName"
                    placeholder={t("admin.businessNamePlaceholder")}
                    value={newBusinessName}
                    onChange={(e) => setNewBusinessName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessEmail">{t("admin.businessEmail")}</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    placeholder={t("admin.businessEmailPlaceholder")}
                    value={newBusinessEmail}
                    onChange={(e) => setNewBusinessEmail(e.target.value)}
                  />
                </div>
                <Button onClick={createInvite} disabled={creating} className="w-full">
                  {creating ? t("common.loading") : t("admin.createInvite")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : invites.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {t("admin.noInvites")}
          </p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.inviteCode")}</TableHead>
                  <TableHead>{t("admin.businessName")}</TableHead>
                  <TableHead>{t("admin.status")}</TableHead>
                  <TableHead>{t("admin.createdAt")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {invite.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyCode(invite.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{invite.business_name}</p>
                        {invite.business_email && (
                          <p className="text-xs text-muted-foreground">{invite.business_email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {invite.is_claimed ? (
                        <Badge variant="default" className="bg-green-500">
                          <Check className="h-3 w-3 mr-1" />
                          {t("admin.claimed")}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {t("admin.pending")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(invite.created_at).toLocaleDateString()}
                      {invite.claimed_at && (
                        <p className="text-xs">
                          {t("admin.claimedOn")} {new Date(invite.claimed_at).toLocaleDateString()}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {!invite.is_claimed && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteInvite(invite.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
