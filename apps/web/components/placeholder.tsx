"use client";

import { EmptyState } from "@consent/ui";
import { useTranslation } from "react-i18next";

export function Placeholder({ titleKey, featureIds }: { titleKey: string; featureIds: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-h2 text-primary">{t(titleKey)}</h1>
      <EmptyState title={t("placeholder.title")} body={`${t("placeholder.body")} (${featureIds})`} />
    </div>
  );
}
