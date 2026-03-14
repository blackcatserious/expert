"use client";
import { SignedIn, SignedOut, useClerk } from "@clerk/nextjs";
import Landing from "./landing";
import ChatApp from "./chat_app";

export default function PageWrapper() {
  const { openSignIn } = useClerk();
  return (
    <>
      <SignedOut>
        <Landing onEnter={() => openSignIn()} />
      </SignedOut>
      <SignedIn>
        <ChatApp />
      </SignedIn>
    </>
  );
}
