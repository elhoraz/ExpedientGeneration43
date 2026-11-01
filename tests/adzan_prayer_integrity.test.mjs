import test from "node:test";
import assert from "node:assert/strict";
import { calculatePrayerTimes, findNearestCity, POPULAR_CITIES } from "../src/lib/prayerTimes.ts";

test("Prayer Schedule & Kemenag Integrity Suite", async (t) => {
  await t.test("findNearestCity should accurately match Jakarta coordinates", () => {
    // Monas Jakarta coordinates: -6.1754, 106.8272
    const nearest = findNearestCity(-6.1754, 106.8272);
    assert.equal(nearest.name, "Jakarta");
    assert.equal(nearest.kemenagCityId, "1301");
  });

  await t.test("findNearestCity should accurately match Ponorogo coordinates", () => {
    // Slahung Ponorogo coordinates: -7.9866, 111.4328
    const nearest = findNearestCity(-7.9866, 111.4328);
    assert.equal(nearest.name, "Ponorogo (Arrisalah)");
    assert.equal(nearest.kemenagCityId, "1621");
  });

  await t.test("findNearestCity should accurately match Surabaya coordinates", () => {
    // Tunjungan Surabaya coordinates: -7.2619, 112.7388
    const nearest = findNearestCity(-7.2619, 112.7388);
    assert.equal(nearest.name, "Surabaya");
    assert.equal(nearest.kemenagCityId, "1638");
  });

  await t.test("calculatePrayerTimes must include +2 min ihtiyat on Subuh and correct rounding", () => {
    const testDate = new Date("2026-11-01T12:00:00+07:00");
    const sched = calculatePrayerTimes(-7.8671, 111.4647, 7, testDate);

    assert.ok(sched.subuh, "Subuh must be present");
    assert.ok(sched.dzuhur, "Dzuhur must be present");
    assert.ok(sched.ashar, "Ashar must be present");
    assert.ok(sched.maghrib, "Maghrib must be present");
    assert.ok(sched.isya, "Isya must be present");

    // Subuh with +2 min ihtiyat for Ponorogo on 2026-11-01 should be 03:47 or 03:48
    const [sH, sM] = sched.subuh.split(":").map(Number);
    assert.equal(sH, 3);
    assert.ok(sM >= 46 && sM <= 48, `Subuh minutes should be 47 or 48, got ${sM}`);
  });
});

