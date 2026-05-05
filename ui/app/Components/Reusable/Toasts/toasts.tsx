import {
  showToast,
  type ToastOptions,
} from "@dynatrace/strato-components/notifications";
import type React from "react";

interface ToastPramasType {
  title: string;
  message?: string;
  lifespan?: number | "infinite";
  actions?: React.JSX.Element;
  postition?: ToastOptions["position"];
}

export const showSuccessToast = ({
  title,
  message,
  postition,
}: ToastPramasType) => {
  return showToast({
    type: "success",
    title,
    message,
    position: postition ?? "bottom-right",
  });
};

export const showErrorToast = ({
  title,
  message,
  postition,
}: ToastPramasType) => {
  return showToast({
    type: "critical",
    title,
    message,
    position: postition ?? "bottom-left",
  });
};

export const showInfoToast = ({
  title,
  message,
  lifespan,
  actions,
  postition,
}: ToastPramasType) => {
  return showToast({
    type: "info",
    title,
    message,
    lifespan,
    actions,
    position: postition ?? "bottom-left",
  });
};
