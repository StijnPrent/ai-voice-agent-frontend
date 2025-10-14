"use client";

import {ReactNode} from "react";
import {Info} from "lucide-react";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {cn} from "@/lib/utils";

interface InfoTooltipProps {
  label: string;
  content: ReactNode;
  iconClassName?: string;
}

export function InfoTooltip({ label, content, iconClassName }: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`${label} toelichting`}
          className="text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded-full"
        >
          <Info className={cn("h-4 w-4", iconClassName)} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" className="max-w-xs text-sm leading-snug">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
