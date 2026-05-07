"use client";

import { motion } from "framer-motion";
import type { ChatIntent } from "../chat-types";
import { INTENT_HERO } from "../data/intent-hero";
import { T } from "../data/tokens";

interface IntentHeroProps {
  intent: ChatIntent;
}

export function IntentHero({ intent }: IntentHeroProps) {
  const spec = INTENT_HERO[intent];
  return (
    <div className="flex w-full flex-col items-center text-center">
      <DiscoveryLogo />
      <motion.div
        key={intent}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6 flex flex-col items-center"
      >
        <p
          className="text-[12px] font-medium tracking-[0.22em] uppercase"
          style={{ color: T.stone }}
        >
          LINKR
        </p>
        <h1
          className="mt-3 max-w-[680px] text-[32px] leading-[1.18] font-semibold tracking-[-0.022em] sm:text-[34px]"
          style={{ color: T.nearBlack }}
        >
          {spec.question}
        </h1>
        <p className="mt-4 max-w-[560px] text-[15px] leading-[1.7]" style={{ color: T.charcoal }}>
          {spec.oneLiner}
        </p>
      </motion.div>
    </div>
  );
}

function DiscoveryLogo() {
  return (
    <div className="relative h-20 w-20">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        className="h-full w-full"
        aria-hidden="true"
      >
        <g clipPath="url(#discovery_logo_clip)">
          <mask
            id="discovery_logo_mask"
            style={{ maskType: "alpha" }}
            width="200"
            height="200"
            x="0"
            y="0"
            maskUnits="userSpaceOnUse"
          >
            <path
              fill="#fff"
              fillRule="evenodd"
              d="M100 150c27.614 0 50-22.386 50-50s-22.386-50-50-50-50 22.386-50 50 22.386 50 50 50zm0 50c55.228 0 100-44.772 100-100S155.228 0 100 0 0 44.772 0 100s44.772 100 100 100z"
              clipRule="evenodd"
            />
          </mask>
          <g mask="url(#discovery_logo_mask)">
            <path fill="#fffdf9" d="M0 0h200v200H0z" />
            <path fill="#ff4f00" fillOpacity="0.18" d="M0 0h200v200H0z" />
            <g filter="url(#discovery_logo_blur)">
              <path fill="#ff4f00" d="M18 32h92v68H18z" />
              <path fill="#ff4f00" d="M15-24h173v98H15z" />
              <path fill="#ff4f00" d="M5 70h170v156H5z" />
              <path fill="#ff4f00" d="M100 51h130v103H100z" />
            </g>
          </g>
        </g>
        <defs>
          <filter
            id="discovery_logo_blur"
            width="385"
            height="410"
            x="-75"
            y="-104"
            colorInterpolationFilters="sRGB"
            filterUnits="userSpaceOnUse"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur result="blur" stdDeviation="40" />
          </filter>
          <clipPath id="discovery_logo_clip">
            <path fill="#fff" d="M0 0h200v200H0z" />
          </clipPath>
        </defs>
        <g style={{ mixBlendMode: "overlay" }} mask="url(#discovery_logo_mask)">
          <path
            fill="gray"
            stroke="transparent"
            d="M0 0h200v200H0z"
            filter="url(#discovery_logo_noise)"
          />
        </g>
        <defs>
          <filter
            id="discovery_logo_noise"
            width="100%"
            height="100%"
            x="0%"
            y="0%"
            filterUnits="objectBoundingBox"
          >
            <feTurbulence baseFrequency="0.6" numOctaves="5" result="out1" seed="4" />
            <feComposite in="out1" in2="SourceGraphic" operator="in" result="out2" />
            <feBlend in="SourceGraphic" in2="out2" mode="overlay" result="out3" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
