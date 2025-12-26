"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/server/actions/user";
import { MediaUploader } from "@/components/handle-media/media-uploader";


import { Badge } from "@/components/ui/badge";

const profileSchema = z.object({
  name: z.string().min(2),
  bio: z.string().max(160).optional(),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  image: z.string().optional(),
  expertise: z.array(z.string()).max(4, "You can select up to 4 expertise").optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const EXPERTISE_OPTIONS = [
  "Stocks", "F&O", "Commodities", "Currencies", "Mutual Funds",
  "Scalping", "Intraday", "Swing Trading", "Position Trading", "Momentum Trading", "Fundamental Trading", "Technical Trading"
];

interface ProfileProps {
  name: string;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  image?: string | null;
  expertise?: string[];
}

export function EditProfileDialog({ profile }: { profile: ProfileProps }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile.name,
      bio: profile.bio || "",
      location: profile.location || "",
      website: profile.website || "",
      image: profile.image || "",
      expertise: profile.expertise || [],
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true);
    try {
      const res = await updateProfile(data);
      if (res.status === "error") throw new Error(res.message);

      toast.success("Profile updated");
      setOpen(false);
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleExpertiseToggle = (badge: string) => {
    const current = form.getValues("expertise") || [];
    if (current.includes(badge)) {
      form.setValue("expertise", current.filter(b => b !== badge));
    } else {
      if (current.length >= 4) {
        toast.error("You can select up to 4 badges only");
        return;
      }
      form.setValue("expertise", [...current, badge]);
    }
    form.trigger("expertise"); // Trigger validation for immediate feedback if needed
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full">Edit Profile</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">

          {/* Avatar Upload */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 relative">
              <MediaUploader
                maxFiles={1}
                acceptedTypes="image"
                onChange={(files) => {
                  if (files?.[0]?.url) {
                    form.setValue("image", files[0].url);
                  }
                }}
                existingMedia={form.getValues("image") ? [{ url: form.getValues("image")!, type: "IMAGE" }] : []}
                className="w-24 h-24 rounded-full overflow-hidden" // Pass classes to style the uploader
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name && <span className="text-xs text-destructive">{form.formState.errors.name.message}</span>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" {...form.register("bio")} className="resize-none h-24" />
          </div>

          <div className="grid gap-2">
            <Label className="mb-2 block">Expertise (Max 4)</Label>
            <div className="flex flex-wrap gap-2">
              {EXPERTISE_OPTIONS.map((badge) => {
                const isSelected = (form.watch("expertise") || []).includes(badge);
                return (
                  <Badge
                    key={badge}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${isSelected ? "hover:bg-primary/90" : "hover:bg-secondary/50"}`}
                    onClick={() => handleExpertiseToggle(badge)}
                  >
                    {badge}
                  </Badge>
                );
              })}
            </div>
            {form.formState.errors.expertise && <span className="text-xs text-destructive">{form.formState.errors.expertise.message}</span>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" {...form.register("location")} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" {...form.register("website")} placeholder="https://" />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}