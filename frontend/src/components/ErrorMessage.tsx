import React from "react";

type Props = {
  message?: string | null;
};

export default function ErrorMessage({ message }: Props) {
  if (!message) return null;
  return (
    <p style={{ color: "red", marginTop: 10, textAlign: "center" }}>
      ❌ {message}
    </p>
  );
}
