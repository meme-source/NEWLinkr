"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AnalysisBasis,
  AnalysisStep,
  ChatChips,
  ChatIntent,
  ChatMessage,
} from "../chat-types";
import { COUNTRY_LABEL, PLATFORM_LABEL } from "../data/chat-chips";
import { getStepBlueprint, getStepsForIntent } from "../data/analysis-steps";
import { getBasisForIntent, getGroupsForIntent, getResultHintForIntent } from "../data/mock-groups";

const TIME_RANGE: Record<ChatIntent, string> = {
  competitor: "近 90 天",
  scenario: "近 30 天",
  trending: "近 14 天",
};

function nextId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function buildBasis(intent: ChatIntent, chips: ChatChips, productLine: string): AnalysisBasis {
  return getBasisForIntent(intent, {
    platformLabel: PLATFORM_LABEL[chips.platform],
    countryLabel: COUNTRY_LABEL[chips.country],
    timeRange: TIME_RANGE[intent],
    productLine,
  });
}

interface UseChatFlowResult {
  messages: ChatMessage[];
  isStreaming: boolean;
  startSearch: (input: {
    intent: ChatIntent;
    text: string;
    chips: ChatChips;
    productLine: string;
  }) => void;
  resetSession: () => void;
}

export function useChatFlow(): UseChatFlowResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const updateAssistant = useCallback(
    (id: string, updater: (prev: AnalysisStep[]) => AnalysisStep[]) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === id && msg.role === "assistant" ? { ...msg, steps: updater(msg.steps) } : msg,
        ),
      );
    },
    [],
  );

  const finishAssistant = useCallback((id: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== id || msg.role !== "assistant") return msg;
        return {
          ...msg,
          groups: getGroupsForIntent(msg.intent),
          hint: getResultHintForIntent(msg.intent),
          streaming: false,
        };
      }),
    );
    setIsStreaming(false);
  }, []);

  const startSearch = useCallback<UseChatFlowResult["startSearch"]>(
    ({ intent, text, chips, productLine }) => {
      clearTimers();

      const userId = nextId("u");
      const assistantId = nextId("a");
      const steps = getStepsForIntent(intent);
      const blueprint = getStepBlueprint(intent);
      const basis = buildBasis(intent, chips, productLine);

      setMessages((prev) => [
        ...prev,
        { id: userId, role: "user", text, chips },
        {
          id: assistantId,
          role: "assistant",
          intent,
          basis,
          steps,
          groups: [],
          hint: null,
          streaming: true,
        },
      ]);
      setIsStreaming(true);

      let cumulative = 0;
      blueprint.forEach((step, idx) => {
        const startAt = cumulative + 60;
        cumulative += step.durationMs;

        const startTimer = setTimeout(() => {
          updateAssistant(assistantId, (prevSteps) =>
            prevSteps.map((s, i) => (i === idx ? { ...s, status: "running" } : s)),
          );
        }, startAt);

        const doneTimer = setTimeout(() => {
          updateAssistant(assistantId, (prevSteps) =>
            prevSteps.map((s, i) => (i === idx ? { ...s, status: "done" } : s)),
          );
        }, cumulative + 60);

        timeoutsRef.current.push(startTimer, doneTimer);
      });

      const finalTimer = setTimeout(() => finishAssistant(assistantId), cumulative + 220);
      timeoutsRef.current.push(finalTimer);
    },
    [clearTimers, finishAssistant, updateAssistant],
  );

  const resetSession = useCallback(() => {
    clearTimers();
    setMessages([]);
    setIsStreaming(false);
  }, [clearTimers]);

  return { messages, isStreaming, startSearch, resetSession };
}
