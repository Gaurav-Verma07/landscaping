"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Communication } from "@/lib/communication-types";
import { CHANNEL_LABELS } from "@/lib/communication-types";
import { formatDistanceToNow } from "date-fns";

export function CommunicationDetailsDialog({
  communication,
  open,
  onOpenChange,
}: {
  communication: Communication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!communication) return null;

  const title =
    communication.channel === "email" && communication.subject
      ? communication.subject
      : communication.channel === "call"
        ? "Call"
        : "SMS";
  const dateLabel = formatDistanceToNow(new Date(communication.createdAt), {
    addSuffix: true,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span className="truncate">{title}</span>
            <span className="text-xs font-normal text-muted-foreground shrink-0">
              {CHANNEL_LABELS[communication.channel]} ·{" "}
              {communication.direction}
            </span>
          </DialogTitle>
          <DialogDescription>
            {communication.contactName}
            {(communication.contactEmail || communication.contactPhone) && (
              <span className="text-muted-foreground">
                {" "}
                · {communication.contactEmail || communication.contactPhone}
              </span>
            )}
            {" · "}
            {dateLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Message</div>
            <div className="rounded-md border bg-muted/30 p-4 text-sm whitespace-pre-wrap">
              {communication.body || "—"}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Contact</div>
              <div>
                <div>{communication.contactName}</div>
                {communication.contactEmail && (
                  <div className="text-muted-foreground">
                    {communication.contactEmail}
                  </div>
                )}
                {communication.contactPhone && (
                  <div className="text-muted-foreground">
                    {communication.contactPhone}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Details</div>
              <div>
                <div>{CHANNEL_LABELS[communication.channel]}</div>
                <div className="text-muted-foreground capitalize">
                  {communication.direction}
                </div>
                <div className="text-muted-foreground">{dateLabel}</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
