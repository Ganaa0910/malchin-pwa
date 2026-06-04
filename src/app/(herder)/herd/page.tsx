import { Search, Bell } from "lucide-react";
import { Topbar, TopbarIcon } from "@/components/nav/Topbar";
import { HerdList } from "@/components/herd/HerdList";
import { mn } from "@/lib/i18n/mn";

export default function HerdPage() {
  return (
    <>
      <Topbar
        title={mn.herd.title}
        sub="10 нэгж"
        right={
          <>
            <TopbarIcon aria-label="Хайх">
              <Search />
            </TopbarIcon>
            <TopbarIcon aria-label={mn.nav.alerts} dot>
              <Bell />
            </TopbarIcon>
          </>
        }
      />
      <HerdList />
    </>
  );
}
