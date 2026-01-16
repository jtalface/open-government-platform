"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ogp/ui";
import { CreatePostModal } from "./CreatePostModal";
import { useTranslation } from "@/lib/i18n/TranslationContext";

export function CreatePostButton() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);

  const { data: channelsData } = useQuery({
    queryKey: ["my-channels"],
    queryFn: async () => {
      const response = await fetch("/api/my-channels");
      if (!response.ok) throw new Error("Failed to fetch channels");
      return response.json();
    },
  });

  const channels = channelsData?.data || [];

  if (channels.length === 0) {
    return null;
  }

  const handleClick = () => {
    if (channels.length === 1) {
      // If user has exactly one channel, go directly to compose
      setSelectedChannel(channels[0]);
      setIsModalOpen(true);
    } else {
      // If user has multiple channels, show selector
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <Button onClick={handleClick} className="flex items-center gap-2">
        <span>📢</span>
        {t("channels.createPost")}
      </Button>

      {isModalOpen && (
        <CreatePostModal
          channels={channels}
          selectedChannel={selectedChannel}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedChannel(null);
          }}
        />
      )}
    </>
  );
}

