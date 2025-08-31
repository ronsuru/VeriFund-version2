import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CreateCampaign, { CreateCampaignHandle } from "@/pages/create-campaign";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent as ConfirmContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader as ConfirmHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Hide the global Navigation when rendering inside the modal by scoping styles
const modalContainerClass = "[&_.verifund-nav]:hidden";

type Props = { open: boolean; onOpenChange: (v: boolean) => void; prefill?: any };

export default function CreateCampaignModal({ open, onOpenChange, prefill }: Props) {
  const childRef = useRef<CreateCampaignHandle>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleRequestClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      // Ensure we evaluate on the next tick so form state is up-to-date
      setTimeout(() => {
        const hasDirty = childRef.current?.hasUnsavedChanges?.() || false;
        if (hasDirty) {
          setConfirmOpen(true);
        } else {
          onOpenChange(false);
        }
      }, 0);
      return;
    }
    onOpenChange(nextOpen);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleRequestClose}>
      <DialogContent className="max-w-4xl p-0 overflow-y-auto max-h-[85vh] rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>Create Campaign</DialogTitle>
        </DialogHeader>
        <div className={`p-6 ${modalContainerClass}`}>
          <CreateCampaign ref={childRef} prefill={prefill} />
        </div>
      </DialogContent>
    </Dialog>

    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <ConfirmContent>
        <ConfirmHeader>
          <AlertDialogTitle>Discard changes?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. Would you like to save this as a draft or discard?
          </AlertDialogDescription>
        </ConfirmHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={async () => {
              await childRef.current?.saveDraft();
              setConfirmOpen(false);
              onOpenChange(false);
            }}
          >
            Save as Draft
          </AlertDialogAction>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={async () => {
              await childRef.current?.discardChanges();
              setConfirmOpen(false);
              onOpenChange(false);
            }}
          >
            Discard
          </AlertDialogAction>
        </AlertDialogFooter>
      </ConfirmContent>
    </AlertDialog>
    </>
  );
}


