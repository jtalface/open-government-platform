"use client";

import { useState } from "react";
import { Button } from "@ogp/ui";
import { CreateIncidentModal } from "./CreateIncidentModal";

export function CreateIncidentButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <svg
          className="mr-2 h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Reportar
      </Button>

      <CreateIncidentModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

