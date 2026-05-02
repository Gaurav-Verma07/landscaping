"use client";

import * as React from "react";
import {
  IconChevronDown, IconChevronLeft, IconChevronRight,
  IconChevronsLeft, IconChevronsRight, IconDotsVertical,
  IconFilter, IconPlus,
} from "@tabler/icons-react";
import { Search, Settings, UserCircle, Megaphone, Reply } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

import { CommunicationDetailsDialog } from "@/components/dashboard/communications/communication-details-dialog";
import { CreateMessageDialog } from "@/components/dashboard/communications/create-message-dialog";
import { LogReplyDialog } from "@/components/dashboard/communications/log-reply-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Communication, CommunicationChannel } from "@/types/communication-types";
import { CHANNEL_LABELS } from "@/types/communication-types";
import { useCommunicationStore } from "@/lib/stores";

type CommunicationsFilters = {
  channel: string;
  direction: string;
  read: string;
  contactType: string;
  sort: "newest" | "oldest";
};

function ChannelBadge({ channel }: { channel: CommunicationChannel }) {
  return (
    <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
      {CHANNEL_LABELS[channel]}
    </Badge>
  );
}

function ContactTypeBadge({ comm }: { comm: Communication }) {
  if (comm.contactType === 'prospect') {
    return (
      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-300 dark:border-orange-800">
        <Megaphone className="size-2.5 mr-1" />
        Prospect
      </Badge>
    )
  }
  return null
}

function CommunicationCard({
  communication,
  onView,
  onLogReply,
}: {
  communication: Communication;
  onView: () => void;
  onLogReply: () => void;
}) {
  const displayTitle =
    communication.channel === "email" && communication.subject
      ? communication.subject
      : communication.channel === "call" ? "Call" : "SMS";
  const snippet =
    communication.body.length > 80 ? `${communication.body.slice(0, 80)}…` : communication.body;
  const dateLabel = formatDistanceToNow(new Date(communication.createdAt), { addSuffix: true });

  const showLogReply =
    communication.contactType === 'prospect' && communication.direction === 'outbound'

  return (
    <Card className="py-5">
      <CardHeader className="pb-2">
        <div className="min-w-0">
          <CardTitle className="truncate text-base">{displayTitle}</CardTitle>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <ChannelBadge channel={communication.channel} />
            <ContactTypeBadge comm={communication} />
            {communication.direction === 'inbound' && communication.contactType === 'prospect' && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-300">
                Reply received
              </Badge>
            )}
            {!communication.read && (
              <span className="rounded-full bg-primary size-2 shrink-0" aria-hidden />
            )}
            <span className="text-xs text-muted-foreground truncate">
              {communication.contactName} · {dateLabel}
            </span>
          </div>
        </div>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="data-[state=open]:bg-muted text-muted-foreground flex size-8">
                <IconDotsVertical />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onView}>View details</DropdownMenuItem>
              {showLogReply && (
                <DropdownMenuItem onClick={onLogReply}>
                  <Reply className="size-4 mr-2" />Log reply
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground line-clamp-2">{snippet || "—"}</p>
        <div className="text-xs text-muted-foreground capitalize">{communication.direction}</div>
      </CardContent>
      <CardFooter className="border-t pt-4 justify-end gap-2">
        {showLogReply && (
          <Button variant="outline" size="sm" onClick={onLogReply}>
            <Reply className="size-3.5 mr-1.5" />Log reply
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onView}>View</Button>
      </CardFooter>
    </Card>
  );
}

export function CommunicationsCards() {
  const router = useRouter()
  const searchParams = useSearchParams();
  const { communications } = useCommunicationStore();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isFiltersModalOpen, setIsFiltersModalOpen] = React.useState(false);
  const [isCreateMessageOpen, setIsCreateMessageOpen] = React.useState(false);
  const [viewId, setViewId] = React.useState<string | null>(null);
  const [logReplyComm, setLogReplyComm] = React.useState<Communication | null>(null);
  const [filters, setFilters] = React.useState<CommunicationsFilters>({
    channel: "all", direction: "all", read: "all", contactType: "all", sort: "newest",
  });
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 12 });

  const prospectIdParam = searchParams.get("prospectId");

  const filteredData = React.useMemo(() => {
    let list = communications.filter((c) => {
      if (prospectIdParam) return c.prospectId === prospectIdParam
      const searchMatch =
        searchQuery === "" ||
        c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (c.contactPhone?.includes(searchQuery) ?? false);
      const channelMatch = filters.channel === "all" || c.channel === filters.channel;
      const directionMatch = filters.direction === "all" || c.direction === filters.direction;
      const readMatch =
        filters.read === "all" ||
        (filters.read === "read" && c.read) ||
        (filters.read === "unread" && !c.read);
      const contactTypeMatch =
        filters.contactType === "all" ||
        (filters.contactType === "prospect" && c.contactType === 'prospect') ||
        (filters.contactType === "customer" && c.contactType !== 'prospect')
      return searchMatch && channelMatch && directionMatch && readMatch && contactTypeMatch;
    });
    if (filters.sort === "oldest") {
      list = [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [communications, searchQuery, filters, prospectIdParam]);

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [filters, searchQuery, prospectIdParam]);

  const pageCount = Math.max(1, Math.ceil(filteredData.length / pagination.pageSize));
  const pageIndex = Math.min(pagination.pageIndex, pageCount - 1);
  const pagedData = React.useMemo(() => {
    const start = pageIndex * pagination.pageSize;
    return filteredData.slice(start, start + pagination.pageSize);
  }, [pageIndex, pagination.pageSize, filteredData]);

  const selected = React.useMemo(
    () => communications.find((c) => c.id === viewId) ?? null,
    [communications, viewId],
  );

  const clearAllFilters = () => {
    setFilters({ channel: "all", direction: "all", read: "all", contactType: "all", sort: "newest" });
  };

  const prospectName = prospectIdParam && filteredData[0]?.contactName

  React.useEffect(() => {
    const openId = searchParams.get("open");
    const create = searchParams.get("create");
    if (openId) setViewId(openId);
    if (create === "1") setIsCreateMessageOpen(true);
  }, [searchParams]);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {prospectIdParam ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/outreach')} className="text-muted-foreground -ml-2 mb-1">
                ← Back to Outreach
              </Button>
              <h1 className="text-2xl font-bold shrink-0">
                Communications — {prospectName || 'Prospect'}
              </h1>
              <p className="text-sm text-muted-foreground">
                All messages sent to and received from this prospect.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold shrink-0">Communications</h1>
              <p className="text-sm text-muted-foreground">
                View and manage emails, SMS, and call logs with contacts and prospects.
              </p>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!prospectIdParam && (
            <Button variant="outline" size="sm" onClick={() => setIsFiltersModalOpen(true)}>
              <IconFilter className="size-4" />
              <span className="hidden sm:inline">Filters</span>
              <IconChevronDown className="size-4" />
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/communications/settings">
              <Settings className="size-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </Button>
          <Button size="sm" onClick={() => setIsCreateMessageOpen(true)}>
            <IconPlus className="size-4" />
            <span className="hidden sm:inline">Create message</span>
          </Button>
        </div>
      </div>

      <CommunicationDetailsDialog
        communication={selected}
        open={!!viewId}
        onOpenChange={(open) => setViewId(open ? viewId : null)}
      />
      <CreateMessageDialog open={isCreateMessageOpen} onOpenChange={setIsCreateMessageOpen} />
      <LogReplyDialog
        open={!!logReplyComm}
        onOpenChange={(open) => !open && setLogReplyComm(null)}
        originalComm={logReplyComm}
      />

      {!prospectIdParam && (
        <div className="space-y-2">
          <Label htmlFor="search-comms">Search Communications</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search-comms"
              type="search"
              placeholder="Search by subject, message, contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {!prospectIdParam && (
        <div className="flex gap-2">
          {(['all', 'customer', 'prospect'] as const).map((type) => (
            <Button
              key={type}
              variant={filters.contactType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, contactType: type }))}
              className="capitalize"
            >
              {type === 'customer' && <UserCircle className="size-3.5 mr-1.5" />}
              {type === 'prospect' && <Megaphone className="size-3.5 mr-1.5" />}
              {type === 'all' ? 'All' : type === 'customer' ? 'Customers' : 'Prospects'}
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {type === 'all'
                  ? communications.length
                  : type === 'prospect'
                    ? communications.filter(c => c.contactType === 'prospect').length
                    : communications.filter(c => c.contactType !== 'prospect').length}
              </Badge>
            </Button>
          ))}
        </div>
      )}

      {pagedData.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pagedData.map((comm) => (
            <CommunicationCard
              key={comm.id}
              communication={comm}
              onView={() => setViewId(comm.id)}
              onLogReply={() => setLogReplyComm(comm)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          {prospectIdParam ? 'No communications with this prospect yet.' : 'No results.'}
        </div>
      )}

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">
            {filteredData.length === 0 ? 0 : pageIndex * pagination.pageSize + 1}-
            {Math.min((pageIndex + 1) * pagination.pageSize, filteredData.length)}
          </span>{" "}
          of <span className="font-medium text-foreground">{filteredData.length}</span>
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Cards per page</p>
            <Select
              value={`${pagination.pageSize}`}
              onValueChange={(v) => setPagination((prev) => ({ ...prev, pageSize: Number(v) }))}
            >
              <SelectTrigger className="h-8 w-[84px]"><SelectValue placeholder={pagination.pageSize} /></SelectTrigger>
              <SelectContent side="top">
                {[12, 24, 36, 48].map((size) => (
                  <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[120px] justify-center text-sm font-medium">
            Page {pageIndex + 1} of {pageCount}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => setPagination((prev) => ({ ...prev, pageIndex: 0 }))} disabled={pageIndex === 0}>
              <IconChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="h-8 w-8 p-0"
              onClick={() => setPagination((prev) => ({ ...prev, pageIndex: Math.max(0, pageIndex - 1) }))} disabled={pageIndex === 0}>
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="h-8 w-8 p-0"
              onClick={() => setPagination((prev) => ({ ...prev, pageIndex: Math.min(pageCount - 1, pageIndex + 1) }))} disabled={pageIndex >= pageCount - 1}>
              <IconChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => setPagination((prev) => ({ ...prev, pageIndex: pageCount - 1 }))} disabled={pageIndex >= pageCount - 1}>
              <IconChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isFiltersModalOpen} onOpenChange={setIsFiltersModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>Filters</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="channel" className="mb-2">Channel</Label>
                <Select value={filters.channel} onValueChange={(v) => setFilters((prev) => ({ ...prev, channel: v }))}>
                  <SelectTrigger id="channel" className="w-full"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="direction" className="mb-2">Direction</Label>
                <Select value={filters.direction} onValueChange={(v) => setFilters((prev) => ({ ...prev, direction: v }))}>
                  <SelectTrigger id="direction" className="w-full"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="read" className="mb-2">Read status</Label>
                <Select value={filters.read} onValueChange={(v) => setFilters((prev) => ({ ...prev, read: v }))}>
                  <SelectTrigger id="read" className="w-full"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sort" className="mb-2">Sort</Label>
                <Select value={filters.sort} onValueChange={(v) => setFilters((prev) => ({ ...prev, sort: v as CommunicationsFilters["sort"] }))}>
                  <SelectTrigger id="sort" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={clearAllFilters}>Clear All</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsFiltersModalOpen(false)}>Cancel</Button>
              <Button onClick={() => setIsFiltersModalOpen(false)}>Apply Filters</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}