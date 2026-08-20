"use client";

import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";

interface Banner {
  type?: "image" | "video";
  image?: string;
  video?: string;
  link?: string;
  isActive?: boolean;
}

interface BannerVideoProps {
  src: string;
  active: boolean;
  index: number;
  onEnded: () => void;
}

function BannerVideo({
  src,
  active,
  index,
  onEnded,
}: BannerVideoProps) {
  const videoRef =
    useRef<HTMLVideoElement>(null);

  const [videoError, setVideoError] =
    useState<string>("");

  const [videoInfo, setVideoInfo] =
    useState<string>("Loading...");

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    console.log(
      "=============================="
    );
    console.log(
      "BANNER VIDEO"
    );
    console.log(
      "URL:",
      src
    );
    console.log(
      "ACTIVE:",
      active
    );
    console.log(
      "=============================="
    );

    if (!active) {
      video.pause();
      return;
    }

    setVideoError("");
    setVideoInfo("Loading video...");

    video.muted = true;
    video.defaultMuted = true;

    try {
      video.currentTime = 0;
    } catch {}

    /*
     * Force browser to reload source.
     */
    video.load();

    const tryPlay = async () => {
      try {
        await video.play();

        console.log(
          "VIDEO PLAYING SUCCESSFULLY"
        );

        setVideoInfo(
          "Playing successfully"
        );
      } catch (error) {
        console.error(
          "VIDEO PLAY ERROR:",
          error
        );

        setVideoInfo(
          "Autoplay failed - use controls"
        );
      }
    };

    const timer =
      window.setTimeout(
        tryPlay,
        500
      );

    return () => {
      window.clearTimeout(timer);
    };
  }, [src, active]);

  const handleLoadedMetadata =
    () => {
      const video =
        videoRef.current;

      if (!video) return;

      console.log(
        "VIDEO METADATA LOADED"
      );

      console.log(
        "Duration:",
        video.duration
      );

      console.log(
        "Video width:",
        video.videoWidth
      );

      console.log(
        "Video height:",
        video.videoHeight
      );

      console.log(
        "Ready state:",
        video.readyState
      );

      setVideoInfo(
        `Loaded ${video.videoWidth}x${video.videoHeight}, ${video.duration.toFixed(
          2
        )} sec`
      );
    };

  const handleCanPlay = () => {
    console.log(
      "VIDEO CAN PLAY"
    );

    if (!active) return;

    const video =
      videoRef.current;

    if (!video) return;

    video.muted = true;

    video.play().catch((error) => {
      console.warn(
        "Play failed:",
        error
      );
    });
  };

  const handlePlaying = () => {
    console.log(
      "VIDEO PLAYING EVENT"
    );

    setVideoInfo(
      "Video is playing"
    );
  };

  const handleWaiting = () => {
    console.log(
      "VIDEO WAITING / BUFFERING"
    );

    setVideoInfo(
      "Video buffering..."
    );
  };

  const handleError = () => {
    const video =
      videoRef.current;

    const error =
      video?.error;

    console.error(
      "================================"
    );

    console.error(
      "VIDEO LOAD ERROR"
    );

    console.error(
      "URL:",
      src
    );

    console.error(
      "MediaError:",
      error
    );

    if (error) {
      console.error(
        "Error code:",
        error.code
      );

      console.error(
        "Error message:",
        error.message
      );
    }

    console.error(
      "================================"
    );

    let message =
      "Video failed to load.";

    if (error) {
      switch (error.code) {
        case 1:
          message =
            "Video loading aborted.";
          break;

        case 2:
          message =
            "Network error while loading video.";
          break;

        case 3:
          message =
            "Video decoding failed. The video codec may not be supported.";
          break;

        case 4:
          message =
            "Video format/source is not supported.";
          break;
      }
    }

    setVideoError(message);
    setVideoInfo("Video error");
  };

  return (
    <div className="absolute inset-0 bg-black">
      <video
        ref={videoRef}
        src={src}
        className="
          absolute inset-0
          w-full
          h-full
          object-cover
          bg-black
        "
        muted
        defaultMuted
        autoPlay
        loop={false}
        playsInline
        controls
        preload="auto"
        onLoadedMetadata={
          handleLoadedMetadata
        }
        onCanPlay={
          handleCanPlay
        }
        onPlaying={
          handlePlaying
        }
        onWaiting={
          handleWaiting
        }
        onEnded={
          onEnded
        }
        onError={
          handleError
        }
      />

      {/* Debug information */}
      <div
        className="
          absolute
          left-2
          bottom-2
          z-40
          max-w-[90%]
          rounded
          bg-black/70
          px-2
          py-1
          text-[10px]
          text-white
          pointer-events-none
        "
      >
        <div>
          {videoInfo}
        </div>

        {videoError && (
          <div className="text-red-300">
            {videoError}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BannerCarousel({
  banners,
}: {
  banners: Banner[];
}) {
  const [current, setCurrent] =
    useState(0);

  const activeBanners =
    banners.filter(
      (banner) =>
        banner.isActive !== false
    );

  useEffect(() => {
    if (
      activeBanners.length > 0 &&
      current >=
        activeBanners.length
    ) {
      setCurrent(0);
    }
  }, [
    activeBanners.length,
    current,
  ]);

  /*
   * Images automatically move after
   * 5 seconds.
   *
   * Videos move when they finish.
   */
  useEffect(() => {
    if (
      activeBanners.length <= 1
    ) {
      return;
    }

    const banner =
      activeBanners[current];

    if (
      banner?.type === "video"
    ) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setCurrent(
          (prev) =>
            (prev + 1) %
            activeBanners.length
        );
      }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    current,
    activeBanners,
  ]);

  if (
    activeBanners.length === 0
  ) {
    return null;
  }

  const nextSlide = () => {
    setCurrent(
      (prev) =>
        (prev + 1) %
        activeBanners.length
    );
  };

  return (
    <div className="relative w-full overflow-hidden bg-black">
      <div
        className="
          flex
          transition-transform
          duration-500
          ease-in-out
        "
        style={{
          transform: `translateX(-${
            current * 100
          }%)`,
        }}
      >
        {activeBanners.map(
          (banner, index) => {
            const isVideo =
              banner.type ===
              "video";

            const videoUrl =
              banner.video ||
              (isVideo
                ? banner.image
                : "");

            const imageUrl =
              banner.image || "";

            /*
             * VIDEO
             */
            if (
              isVideo &&
              videoUrl
            ) {
              return (
                <div
                  key={`${videoUrl}-${index}`}
                  className="
                    w-full
                    shrink-0
                  "
                >
                  <div
                    className="
                      relative
                      w-full
                      aspect-[21/9]
                      sm:aspect-[3/1]
                      lg:h-[calc(100vh-80px)]
                      lg:min-h-[600px]
                      lg:max-h-[850px]
                      bg-black
                      overflow-hidden
                    "
                  >
                    <BannerVideo
                      src={videoUrl}
                      active={
                        index === current
                      }
                      index={index}
                      onEnded={
                        nextSlide
                      }
                    />

                    {banner.link && (
                      <Link
                        href={
                          banner.link
                        }
                        className="
                          absolute
                          inset-0
                          z-20
                        "
                        aria-label={`Banner ${
                          index + 1
                        }`}
                      />
                    )}
                  </div>
                </div>
              );
            }

            /*
             * IMAGE
             */
            if (imageUrl) {
              return (
                <div
                  key={`${imageUrl}-${index}`}
                  className="
                    w-full
                    shrink-0
                  "
                >
                  <Link
                    href={
                      banner.link ||
                      "#"
                    }
                    className="block"
                  >
                    <div
                      className="
                        relative
                        w-full
                        aspect-[21/9]
                        sm:aspect-[3/1]
                        lg:h-[calc(100vh-100px)]
                        lg:min-h-[400px]
                        lg:max-h-[500px]
                        bg-black
                      "
                    >
                      <img
                        src={imageUrl}
                        alt={`Banner ${
                          index + 1
                        }`}
                        className="
                          absolute
                          inset-0
                          w-full
                          h-full
                          object-cover
                        "
                        loading={
                          index === 0
                            ? "eager"
                            : "lazy"
                        }
                        decoding="async"
                      />
                    </div>
                  </Link>
                </div>
              );
            }

            return null;
          }
        )}
      </div>

      {activeBanners.length >
        1 && (
        <div
          className="
            absolute
            bottom-5
            left-1/2
            -translate-x-1/2
            z-50
            flex
            items-center
            gap-1.5
          "
        >
          {activeBanners.map(
            (_, index) => (
              <button
                key={index}
                type="button"
                onClick={() =>
                  setCurrent(index)
                }
                className={`
                  h-2
                  rounded-full
                  transition-all
                  duration-300
                  ${
                    index ===
                    current
                      ? "w-6 bg-white"
                      : "w-2 bg-white/60"
                  }
                `}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}