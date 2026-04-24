"use client";

import * as React from "react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconPlus,
} from "@tabler/icons-react";
import {
  MessageSquare,
  Clock,
  ListOrdered,
  CalendarClock,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

import { CreateMessageDialog } from "@/components/dashboard/communications/create-message-dialog";
import { TemplateFormDialog } from "@/components/dashboard/communications/template-form-dialog";
import { AutomationRuleFormDialog } from "@/components/dashboard/communications/automation-rule-form-dialog";
import { FollowUpSequenceFormDialog } from "@/components/dashboard/communications/follow-up-sequence-form-dialog";
import { ScheduleMessageDialog } from "@/components/dashboard/communications/schedule-message-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { MessageTemplate } from "@/lib/communication-types";
import {
  CHANNEL_LABELS,
  AUTOMATION_TRIGGER_LABELS,
} from "@/lib/communication-types";
import {
  useCommunicationStore,
  applyTemplatePlaceholders,
} from "@/lib/communication-store";
import { useCustomerStore } from "@/lib/customer-store";

export function CommunicationSettingsWorkspace() {
  const { customers, addTimelineEvent } = useCustomerStore();
  const {
    templates,
    rules,
    sequences,
    scheduledMessages,
    addTemplate,
    updateTemplate,
    deleteTemplate: deleteTemplateFromStore,
    addRule,
    deleteRule,
    addSequence,
    deleteSequence,
    addScheduledMessage,
    updateScheduledStatus,
    addCommunication,
    runDueScheduledMessages,
  } = useCommunicationStore();
  const [createMessageOpen, setCreateMessageOpen] = React.useState(false);
  const [templateFormOpen, setTemplateFormOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] =
    React.useState<MessageTemplate | null>(null);
  const [deleteTemplate, setDeleteTemplate] =
    React.useState<MessageTemplate | null>(null);
  const [ruleFormOpen, setRuleFormOpen] = React.useState(false);
  const [sequenceFormOpen, setSequenceFormOpen] = React.useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = React.useState(false);

  type SectionId = "templates" | "rules" | "sequences" | "scheduled";
  const [activeSection, setActiveSection] =
    React.useState<SectionId>("templates");
  const [pageIndex, setPageIndex] = React.useState<Record<SectionId, number>>({
    templates: 0,
    rules: 0,
    sequences: 0,
    scheduled: 0,
  });
  const [pageSize, setPageSize] = React.useState(10);
  const isMobile = useIsMobile();

  const setPage = (section: SectionId, index: number) => {
    setPageIndex((prev) => ({ ...prev, [section]: index }));
  };

  function PaginationBar({
    section,
    total,
    currentPage,
  }: {
    section: SectionId;
    total: number;
    currentPage?: number;
  }) {
    const current = currentPage ?? pageIndex[section];
    const count = Math.max(1, Math.ceil(total / pageSize));
    const start = total === 0 ? 0 : current * pageSize + 1;
    const end = Math.min((current + 1) * pageSize, total);
    return (
      <div className="flex items-center justify-between gap-4 py-4 border-t">
        <p className="text-sm text-muted-foreground">
          Showing {start}-{end} of {total}
        </p>
        <div className="flex items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setPageSize(Number(v))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm whitespace-nowrap">
            Page {current + 1} of {count}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={current === 0}
              onClick={() => setPage(section, 0)}
            >
              <IconChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={current === 0}
              onClick={() => setPage(section, current - 1)}
            >
              <IconChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={current >= count - 1}
              onClick={() => setPage(section, current + 1)}
            >
              <IconChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={current >= count - 1}
              onClick={() => setPage(section, count - 1)}
            >
              <IconChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setTemplateFormOpen(true);
  };

  const handleEditTemplate = (t: MessageTemplate) => {
    setEditingTemplate(t);
    setTemplateFormOpen(true);
  };

  const handleSaveTemplate = (
    data: Omit<MessageTemplate, "id" | "updatedAt">,
  ) => {
    if (editingTemplate) {
      updateTemplate(editingTemplate.id, data);
      toast.success("Template updated.");
    } else {
      addTemplate(data);
      toast.success("Template added.");
    }
    setTemplateFormOpen(false);
    setEditingTemplate(null);
  };

  const handleConfirmDelete = () => {
    if (deleteTemplate) {
      deleteTemplateFromStore(deleteTemplate.id);
      toast.success("Template removed.");
      setDeleteTemplate(null);
    }
  };

  const handleRunDueNow = () => {
    const now = new Date().toISOString();
    const due = scheduledMessages.filter(
      (s) => s.status === "pending" && s.sendAt <= now,
    );
    if (due.length === 0) {
      toast.info("No scheduled messages due right now.");
      return;
    }
    for (const s of due) {
      const template = templates.find((t) => t.id === s.templateId);
      const contact = customers.find((c) => c.id === s.contactId);
      if (!template || !contact) continue;
      const { body, subject } = applyTemplatePlaceholders(
        template.body,
        template.subject,
        contact.name,
      );
      addCommunication({
        channel: template.channel,
        subject: template.channel === "email" ? subject : "",
        body,
        contactName: contact.name,
        contactId: contact.id,
        contactEmail: contact.emails?.[0],
        contactPhone: contact.phones?.[0],
        direction: "outbound",
        read: true,
        createdAt: now,
      });
      addTimelineEvent(contact.id, {
        type: "communication",
        title: template.channel === "email" ? subject || "Email" : "SMS",
        date: now,
        description: body.slice(0, 200),
      });
      updateScheduledStatus(s.id, "sent");
    }
    toast.success(`Sent ${due.length} scheduled message(s).`);
  };

  const handleScheduleMessage = (data: {
    contactId: string;
    contactName: string;
    templateId: string;
    sendAt: string;
  }) => {
    addScheduledMessage({
      ...data,
      status: "pending",
    });
    toast.success("Message scheduled.");
  };

  const pendingScheduled = scheduledMessages.filter(
    (s) => s.status === "pending",
  );
  const dueCount = pendingScheduled.filter(
    (s) => s.sendAt <= new Date().toISOString(),
  ).length;

  const pageCount = (total: number) => Math.max(1, Math.ceil(total / pageSize));
  const clamp = (section: SectionId, total: number) =>
    Math.min(pageIndex[section], pageCount(total) - 1);
  const templatesPage = clamp("templates", templates.length);
  const rulesPage = clamp("rules", rules.length);
  const sequencesPage = clamp("sequences", sequences.length);
  const scheduledPage = clamp("scheduled", scheduledMessages.length);
  const templatesSlice = templates.slice(
    templatesPage * pageSize,
    (templatesPage + 1) * pageSize,
  );
  const rulesSlice = rules.slice(
    rulesPage * pageSize,
    (rulesPage + 1) * pageSize,
  );
  const sequencesSlice = sequences.slice(
    sequencesPage * pageSize,
    (sequencesPage + 1) * pageSize,
  );
  const scheduledSlice = scheduledMessages.slice(
    scheduledPage * pageSize,
    (scheduledPage + 1) * pageSize,
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Communication settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Templates, automation rules, sequences, and scheduled messages.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/communications">
              <MessageSquare className="mr-2 size-4" />
              View communications
            </Link>
          </Button>
          <Button size="sm" onClick={() => setCreateMessageOpen(true)}>
            <IconPlus className="mr-2 size-4" />
            Create message
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {!isMobile && (
          <nav className="w-56 shrink-0 border-r bg-muted/30 p-4">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">
              Settings
            </h2>
            <div className="space-y-1">
              <Button
                variant={activeSection === "templates" ? "secondary" : "ghost"}
                className="w-full justify-start"
                size="sm"
                onClick={() => setActiveSection("templates")}
              >
                <FileText className="mr-2 size-4" />
                Templates ({templates.length})
              </Button>
              <Button
                variant={activeSection === "rules" ? "secondary" : "ghost"}
                className="w-full justify-start"
                size="sm"
                onClick={() => setActiveSection("rules")}
              >
                <Clock className="mr-2 size-4" />
                Automation rules ({rules.length})
              </Button>
              <Button
                variant={activeSection === "sequences" ? "secondary" : "ghost"}
                className="w-full justify-start"
                size="sm"
                onClick={() => setActiveSection("sequences")}
              >
                <ListOrdered className="mr-2 size-4" />
                Follow-up sequences ({sequences.length})
              </Button>
              <Button
                variant={activeSection === "scheduled" ? "secondary" : "ghost"}
                className="w-full justify-start"
                size="sm"
                onClick={() => setActiveSection("scheduled")}
              >
                <CalendarClock className="mr-2 size-4" />
                Scheduled messages ({scheduledMessages.length})
              </Button>
            </div>
          </nav>
        )}

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {isMobile && (
            <div className="shrink-0 border-b p-2 flex gap-1 overflow-x-auto bg-muted/30">
              <Button
                variant={
                  activeSection === "templates" ? "secondary" : "outline"
                }
                size="sm"
                onClick={() => setActiveSection("templates")}
              >
                Templates
              </Button>
              <Button
                variant={activeSection === "rules" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setActiveSection("rules")}
              >
                Rules
              </Button>
              <Button
                variant={
                  activeSection === "sequences" ? "secondary" : "outline"
                }
                size="sm"
                onClick={() => setActiveSection("sequences")}
              >
                Sequences
              </Button>
              <Button
                variant={
                  activeSection === "scheduled" ? "secondary" : "outline"
                }
                size="sm"
                onClick={() => setActiveSection("scheduled")}
              >
                Scheduled
              </Button>
            </div>
          )}
          <div className="flex-1 overflow-auto p-4">
            {activeSection === "templates" && (
              <Card>
                <CardHeader>
                  <div className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">
                        Message templates
                      </CardTitle>
                      <CardDescription>
                        Reusable templates. Use {"{{contact_name}}"} or{" "}
                        {"{{invoice_number}}"}.
                      </CardDescription>
                    </div>
                    <Button size="sm" onClick={handleAddTemplate}>
                      <IconPlus className="mr-2 size-4" />
                      Add template
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {templates.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center px-6">
                      No templates yet.
                    </p>
                  ) : (
                    <>
                      <ul className="divide-y px-6">
                        {templatesSlice.map((t) => (
                          <li
                            key={t.id}
                            className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">{t.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {CHANNEL_LABELS[t.channel]}
                                </Badge>
                              </div>
                              {t.channel === "email" && t.subject && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  Subject: {t.subject}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {t.body}
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 shrink-0"
                                >
                                  <IconDotsVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEditTemplate(t)}
                                >
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleteTemplate(t)}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </li>
                        ))}
                      </ul>
                      <div className="px-6">
                        <PaginationBar
                          section="templates"
                          total={templates.length}
                          currentPage={templatesPage}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === "rules" && (
              <Card>
                <CardHeader>
                  <div className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">
                        Automation rules
                      </CardTitle>
                      <CardDescription>
                        When a trigger happens, send a message after a delay.
                      </CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setRuleFormOpen(true)}>
                      <IconPlus className="mr-2 size-4" />
                      Add rule
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {rules.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center px-6">
                      No automation rules yet.
                    </p>
                  ) : (
                    <>
                      <ul className="divide-y px-6">
                        {rulesSlice.map((r) => {
                          const template = templates.find(
                            (t) => t.id === r.templateId,
                          );
                          return (
                            <li
                              key={r.id}
                              className="flex items-center justify-between py-4"
                            >
                              <div>
                                <p className="font-medium">{r.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {AUTOMATION_TRIGGER_LABELS[r.trigger]} →{" "}
                                  {r.delayDays} day(s) · {template?.name ?? "—"}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  deleteRule(r.id);
                                  toast.success("Rule removed.");
                                }}
                              >
                                Remove
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                      <div className="px-6">
                        <PaginationBar
                          section="rules"
                          total={rules.length}
                          currentPage={rulesPage}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === "sequences" && (
              <Card>
                <CardHeader>
                  <div className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">
                        Follow-up sequences
                      </CardTitle>
                      <CardDescription>
                        Multi-step sequences (e.g. Day 0, Day 3, Day 7).
                      </CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setSequenceFormOpen(true)}>
                      <IconPlus className="mr-2 size-4" />
                      Add sequence
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {sequences.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center px-6">
                      No sequences yet.
                    </p>
                  ) : (
                    <>
                      <ul className="divide-y px-6">
                        {sequencesSlice.map((seq) => (
                          <li
                            key={seq.id}
                            className="flex items-center justify-between py-4"
                          >
                            <div>
                              <p className="font-medium">{seq.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {seq.steps.length} step(s):{" "}
                                {seq.steps
                                  .map((s) => {
                                    const t = templates.find(
                                      (x) => x.id === s.templateId,
                                    );
                                    return `Day ${s.delayDays} (${t?.name ?? "—"})`;
                                  })
                                  .join(", ")}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                deleteSequence(seq.id);
                                toast.success("Sequence removed.");
                              }}
                            >
                              Remove
                            </Button>
                          </li>
                        ))}
                      </ul>
                      <div className="px-6">
                        <PaginationBar
                          section="sequences"
                          total={sequences.length}
                          currentPage={sequencesPage}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === "scheduled" && (
              <Card>
                <CardHeader>
                  <div className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">
                        Scheduled messages
                      </CardTitle>
                      <CardDescription>
                        One-off or rule-driven. Use &quot;Run due now&quot; to
                        send past-due (demo).
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {dueCount > 0 && (
                        <Button size="sm" onClick={handleRunDueNow}>
                          Run due now ({dueCount})
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setScheduleDialogOpen(true)}
                      >
                        <IconPlus className="mr-2 size-4" />
                        Schedule message
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {scheduledMessages.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center px-6">
                      No scheduled messages.
                    </p>
                  ) : (
                    <>
                      <ul className="divide-y px-6">
                        {scheduledSlice.map((s) => {
                          const template = templates.find(
                            (t) => t.id === s.templateId,
                          );
                          const isPast = s.sendAt <= new Date().toISOString();
                          return (
                            <li
                              key={s.id}
                              className="flex items-center justify-between py-4"
                            >
                              <div>
                                <p className="font-medium">
                                  {s.contactName} · {template?.name ?? "—"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(s.sendAt).toLocaleString()} ·{" "}
                                  {s.status}
                                  {s.status === "pending" && isPast && " (due)"}
                                </p>
                              </div>
                              {s.status === "pending" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    updateScheduledStatus(s.id, "cancelled")
                                  }
                                >
                                  Cancel
                                </Button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                      <div className="px-6">
                        <PaginationBar
                          section="scheduled"
                          total={scheduledMessages.length}
                          currentPage={scheduledPage}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <CreateMessageDialog
        open={createMessageOpen}
        onOpenChange={setCreateMessageOpen}
      />

      <TemplateFormDialog
        open={templateFormOpen}
        onOpenChange={(open) => {
          setTemplateFormOpen(open);
          if (!open) setEditingTemplate(null);
        }}
        template={editingTemplate}
        onSave={handleSaveTemplate}
      />

      <AutomationRuleFormDialog
        open={ruleFormOpen}
        onOpenChange={setRuleFormOpen}
        templates={templates}
        onSave={(data) => {
          addRule({ ...data });
          toast.success("Rule added.");
        }}
      />
      <FollowUpSequenceFormDialog
        open={sequenceFormOpen}
        onOpenChange={setSequenceFormOpen}
        templates={templates}
        onSave={(data) => {
          addSequence(data);
          toast.success("Sequence added.");
        }}
      />
      <ScheduleMessageDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        templates={templates}
        customers={customers}
        onSchedule={handleScheduleMessage}
      />

      <AlertDialog
        open={!!deleteTemplate}
        onOpenChange={(open) => !open && setDeleteTemplate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete template &quot;{deleteTemplate?.name}&quot;? This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
