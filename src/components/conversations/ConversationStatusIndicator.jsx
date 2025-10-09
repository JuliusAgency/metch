import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";

const STATUS_CONFIG = {
  filled: {
    icon: CheckCircle,
    label: "המשרה אוישה",
    color: "bg-green-100 text-green-800"
  },
  filled_via_metch: {
    icon: CheckCircle,
    label: "אוישה דרך Metch",
    color: "bg-purple-100 text-purple-800"
  },
  closed: {
    icon: XCircle,
    label: "המשרה נסגרה",
    color: "bg-red-100 text-red-800"
  },
  paused: {
    icon: Clock,
    label: "מושהית זמנית",
    color: "bg-yellow-100 text-yellow-800"
  }
};

export default function ConversationStatusIndicator({ jobStatus, className = "" }) {
  if (!jobStatus || jobStatus === 'active' || jobStatus === 'draft') {
    return null;
  }

  const config = STATUS_CONFIG[jobStatus];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge className={`${config.color} flex items-center gap-1 ${className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}