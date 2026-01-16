"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, LoadingSpinner, Avatar } from "@ogp/ui";
import { useTranslation } from "@/lib/i18n/TranslationContext";

export function ChannelsList() {
  const { t } = useTranslation();

  const { data, isLoading, error } = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const response = await fetch("/api/channels");
      if (!response.ok) {
        throw new Error("Failed to fetch channels");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center">
        <p className="text-red-600">{t("channels.errorLoading")}</p>
      </div>
    );
  }

  const channels = data?.data || [];

  if (channels.length === 0) {
    return (
      <div className="rounded-xl bg-gray-100 p-12 text-center">
        <div className="mb-4 text-6xl">📢</div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          {t("channels.noChannelsTitle")}
        </h3>
        <p className="text-gray-600">{t("channels.noChannelsDescription")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {channels.map((channel: any) => (
        <Link key={channel.id} href={`/channels/${channel.id}`}>
          <Card hover className="h-full p-6 transition-all">
            <div className="flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="mb-4">
                <Avatar
                  src={channel.avatarUrl || undefined}
                  fallback={channel.name[0]}
                  alt={channel.name}
                  size="xl"
                />
              </div>

              {/* Official Name */}
              <h3 className="mb-1 text-lg font-bold text-gray-900">
                {channel.name}
              </h3>

              {/* Title */}
              <p className="mb-3 text-sm font-medium text-blue-600">
                {channel.title}
              </p>

              {/* Verified Badge */}
              <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {t("channels.verified")}
              </div>

              {/* Bio Preview */}
              {channel.bio && (
                <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                  {channel.bio}
                </p>
              )}

              {/* View Button */}
              <div className="mt-4 w-full">
                <span className="block w-full rounded-lg bg-blue-50 px-4 py-2 text-center text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100">
                  {t("channels.viewChannel")}
                </span>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

