"use client";

import { useEffect, useState } from "react";
import { Loader2, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateGroup } from "@/lib/group-queries";

export function CreateGroupDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (groupId: string) => void;
}) {
  const [name, setName] = useState("");
  const create = useCreateGroup();

  useEffect(() => {
    if (!open) return;
    setName("");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const group = await create.mutateAsync(trimmed);
    onCreated?.(group.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-medium reveal">
        <div className="relative border-b border-border bg-gradient-to-b from-primary/10 to-transparent px-6 py-5">
          <div className="aurora-blob -right-10 -top-16 h-40 w-40 bg-primary/25 animate-aurora" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="relative flex items-center gap-2 text-primary">
            <Users className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">New group</span>
          </div>
          <h2 className="relative mt-2 font-display text-xl font-bold tracking-tight">
            Create a family group
          </h2>
          <p className="relative mt-1 text-sm text-muted-foreground">
            You'll be the owner. Invite people once it's created.
          </p>
        </div>

        <div className="px-6 py-5">
          <label className="mb-1.5 block text-sm font-medium">Group name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g. Aït Family, Flatmates"
            className="shadow-soft"
            autoFocus
            maxLength={40}
          />
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!name.trim() || create.isPending} className="glow-primary">
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
              Create
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
