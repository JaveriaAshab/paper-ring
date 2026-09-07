import React from "react";

export default function Avatar({ src, name = "Friend", size = "md" }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={`avatar avatar-${size}`}>
      {src ? (
        <img src={src} alt={`${name}'s avatar`} />
      ) : (
        <span>{initials || "?"}</span>
      )}
    </div>
  );
}
