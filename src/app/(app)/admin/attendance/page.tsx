import { CalendarCheck } from "lucide-react";
import { PhasePlaceholder } from "@/components/shell/phase-placeholder";

export default function AttendancePage() {
  return (
    <PhasePlaceholder
      icon={CalendarCheck}
      title="Attendance"
      phase="Phase 4"
      description="Shifts, clock in/out, aux states and leave land next, once the identity/campaign foundation is settled."
      bullets={[
        "Daily muster: present / late / absent / leave, by team and shift",
        "Clock-in/out with shift-timezone-aware late calculation",
        "Aux states with a no-overlap trigger — prayer break as first-class",
        "Monthly timesheet grid, XLSX export shaped for payroll",
      ]}
    />
  );
}
