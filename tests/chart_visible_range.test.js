import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { setVisibleRange } from '../src/core/chart.js';

function browserDeps(times) {
  let zoomed = null;
  const step = times.length > 1 ? times[1] - times[0] : 1;
  const timeAt = (i) => i < times.length
    ? times[i]
    : times.at(-1) + (i - (times.length - 1)) * step;
  const bars = {
    firstIndex: () => 0,
    lastIndex: () => times.length - 1,
    valueAt: (i) => i >= 0 && i < times.length ? [times[i]] : null,
  };
  const mainSeries = {
    bars: () => bars,
    requestMoreDataAvailable: () => false,
  };
  const timeScale = {
    zoomToBarsRange: (from, to) => { zoomed = { from, to }; },
  };
  const chart = {
    _chartWidget: { model: () => ({ mainSeries: () => mainSeries, timeScale: () => timeScale }) },
    getVisibleRange: () => zoomed ? { from: timeAt(zoomed.from), to: timeAt(zoomed.to) } : null,
  };
  const context = {
    window: { TradingViewApi: { _activeChartWidgetWV: { value: () => chart } } },
  };
  const evaluate = async (expr) => vm.runInNewContext(expr, context);
  return {
    _deps: { evaluate, evaluateAsync: evaluate, waitForChartReady: async () => true },
    getZoomed: () => zoomed,
  };
}

describe('setVisibleRange() — exact bar boundaries', () => {
  it('keeps the first bar when its timestamp exactly equals `from`', async () => {
    const { _deps, getZoomed } = browserDeps([1000, 1900, 2800]);
    const result = await setVisibleRange({ from: 1000, to: 2800, _deps });
    assert.deepEqual(getZoomed(), { from: 0, to: 2 });
    assert.equal(result.actual.from, 1000);
    assert.equal(result.actual.to, 2800);
  });

  it('preserves future whitespace when `to` is beyond the last loaded bar', async () => {
    const { _deps, getZoomed } = browserDeps([1000, 1900, 2800]);
    const result = await setVisibleRange({ from: 1000, to: 3700, _deps });
    assert.deepEqual(getZoomed(), { from: 0, to: 3 });
    assert.equal(result.actual.from, 1000);
    assert.equal(result.actual.to, 3700);
  });
});
