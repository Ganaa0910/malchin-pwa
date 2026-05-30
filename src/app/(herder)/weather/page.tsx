import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { WeatherScreen } from "@/components/weather/WeatherScreen";
import { mn } from "@/lib/i18n/mn";

export default function WeatherPage() {
  return (
    <>
      <ScreenHeader title={mn.nav.weather} subtitle="Төв · Батсүмбэр" />
      <WeatherScreen />
    </>
  );
}
