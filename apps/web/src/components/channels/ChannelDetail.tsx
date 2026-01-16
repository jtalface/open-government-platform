"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, LoadingSpinner, Avatar, Badge } from "@ogp/ui";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useTranslation } from "@/lib/i18n/TranslationContext";

interface ChannelDetailProps {
  channelId: string;
}

export function ChannelDetail({ channelId }: ChannelDetailProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();

  // Fetch channel info
  const {
    data: channelData,
    isLoading: isLoadingChannel,
    error: channelError,
  } = useQuery({
    queryKey: ["channel", channelId],
    queryFn: async () => {
      const response = await fetch(`/api/channels`);
      if (!response.ok) throw new Error("Failed to fetch channel");
      const data = await response.json();
      return data.data.find((c: any) => c.id === channelId);
    },
  });

  // Fetch posts
  const {
    data: postsData,
    isLoading: isLoadingPosts,
    error: postsError,
  } = useQuery({
    queryKey: ["channel-posts", channelId],
    queryFn: async () => {
      const response = await fetch(`/api/channels/${channelId}/posts`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },
  });

  if (isLoadingChannel) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (channelError || !channelData) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center">
        <p className="text-red-600">{t("channels.channelNotFound")}</p>
      </div>
    );
  }

  const posts = postsData?.data?.items || [];
  const dateFnsLocale = locale === "pt" ? ptBR : enUS;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        {t("common.back")}
      </button>

      {/* Channel Header */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8">
          <div className="flex items-center gap-6">
            <Avatar
              src={channelData.avatarUrl || undefined}
              fallback={channelData.name[0]}
              alt={channelData.name}
              size="2xl"
              className="border-4 border-white"
            />
            <div className="flex-1 text-white">
              <div className="mb-2 flex items-center gap-2">
                <h1 className="text-3xl font-bold">{channelData.name}</h1>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="mb-3 text-lg font-medium text-blue-50">
                {channelData.title}
              </p>
              {channelData.bio && (
                <p className="text-blue-50">{channelData.bio}</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Posts Feed */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-gray-900">
          {t("channels.updates")}
        </h2>

        {isLoadingPosts ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : posts.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mb-4 text-6xl">📢</div>
            <p className="text-gray-600">{t("channels.noPostsYet")}</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post: any) => (
              <Card key={post.id} className="p-6">
                {/* Post Header */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={post.channel.avatarUrl || undefined}
                      fallback={post.channel.name[0]}
                      alt={post.channel.name}
                    />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {post.channel.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {post.channel.title}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(post.publishedAt), {
                      addSuffix: true,
                      locale: dateFnsLocale,
                    })}
                  </span>
                </div>

                {/* Post Content */}
                <h3 className="mb-2 text-xl font-bold text-gray-900">
                  {post.title}
                </h3>
                <p className="whitespace-pre-wrap text-gray-700">{post.body}</p>

                {/* Attachments */}
                {post.attachments && post.attachments.length > 0 && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {post.attachments.map((attachment: any, index: number) => (
                      <div
                        key={index}
                        className="overflow-hidden rounded-lg border"
                      >
                        {attachment.type === "IMAGE" ? (
                          <img
                            src={attachment.url}
                            alt="Attachment"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-4">
                            <span>📎</span>
                            <span className="text-sm text-gray-600">
                              {attachment.url}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

