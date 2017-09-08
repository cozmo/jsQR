import { binarize } from "./binarize";
import { decode } from "./decode";
import { extract } from "./extract";
import { locateTrackingPoints } from "./locateTrackingPoints";

export default function(imageData: Uint8ClampedArray, width: number, height: number) {
  const binarized = binarize(imageData, width, height);
  const trackingPoints = locateTrackingPoints(binarized);
  if (!trackingPoints) {
    return null;
  }
  const extracted = extract(binarized, trackingPoints);
  if (!extracted) {
    return null;
  }
  const decoded = decode(extracted);
  if (!decoded) {
    return null;
  }
  return {
    data: decoded,
    trackingPoints,
  };
}
