import { useEffect, useState } from "react";
import { CAMPAIGNS } from "../data/campaigns.ts";
import { CAMPAIGN_PRESETS, NORMANDY_CAMPAIGN_END, NORMANDY_CAMPAIGN_START } from "../data/presets.ts";
import { operationTicks, layoutOperationTicks, type PlacedTick } from "../data/ticks.ts";
import { SAMPLE_START, WAR_DAYS, WAR_END, WAR_START, dateFromIndex, dayIndex, formatDisplay, formatStencil } from "../lib/dates.ts";
import type { Battle } from "../types.ts";

interface TimelineProps {
  date: string;
  playing: boolean;
  speed: 1 | 5 | 30;
  onScrub: (index: number) => void;
  onTogglePlay: () => void;
  onSpeed: (speed: 1 | 5 | 30) => void;
  onStep: (delta: number) => void;
  onBattle: (id: string) => void;
  onPreset: (date: string) => void;
  onCampaign: (id: string) => void;
  campaignId: string | null;
  battles: readonly Battle[];
  onOverview: () => void;
}

const SPEEDS = [1, 5, 30] as const;

function OperationScale(props: {
  date: string;
  campaignId: string | null;
  onCampaign: (id: string) => void;
  onPreset: (date: string) => void;
}) {
  const [width, setWidth] = useState(0);
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? 0;
      setWidth((current) => (Math.abs(current - next) < 1 ? current : next));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);
  const ticks = layoutOperationTicks(width);
  return (
    <div className="op-ticks" ref={setNode} aria-label="Operation ticks">
      {ticks.map((tick) => (
        <OperationTickButton key={tick.id} tick={tick} date={props.date} campaignId={props.campaignId} onCampaign={props.onCampaign} onPreset={props.onPreset} />
      ))}
    </div>
  );
}

function OperationTickButton(props: {
  tick: PlacedTick;
  date: string;
  campaignId: string | null;
  onCampaign: (id: string) => void;
  onPreset: (date: string) => void;
}) {
  const { tick } = props;
  const current = tick.kind === "campaign" ? props.campaignId === tick.id : props.date === tick.date;
  const label = tick.kind === "campaign"
    ? `${tick.name}, ${formatDisplay(tick.date)}. Play this campaign.`
    : `${tick.name}, ${formatDisplay(tick.date)}. Jump to this date. No plotted position.`;
  return (
    <button
      type="button"
      className={tick.labeled ? "op-tick" : "op-tick op-tick-quiet"}
      style={{ left: `${tick.left}%`, bottom: `${tick.lane * 22}px` }}
      data-op={tick.id}
      data-labeled={tick.labeled ? "1" : "0"}
      aria-current={current ? "true" : undefined}
      aria-label={label}
      title={label}
      onClick={() => {
        if (tick.kind === "campaign") props.onCampaign(tick.id);
        else props.onPreset(tick.date);
      }}
    >
      {tick.labeled ? tick.name : <span className="sr-only">{tick.name}</span>}
    </button>
  );
}

export function Timeline(props: TimelineProps) {
  const atStart = props.date === WAR_START;
  const atEnd = props.date === WAR_END;
  const sampleLeft = (dayIndex(SAMPLE_START) / WAR_DAYS) * 100;
  const campaignLeft = (dayIndex(NORMANDY_CAMPAIGN_START) / WAR_DAYS) * 100;
  const campaignWidth = ((dayIndex(NORMANDY_CAMPAIGN_END) - dayIndex(NORMANDY_CAMPAIGN_START)) / WAR_DAYS) * 100;
  const preset = CAMPAIGN_PRESETS.find((item) => item.date === props.date);
  const marked = props.battles.find((battle) => battle.date === props.date);
  const campaign = CAMPAIGNS.find((item) => item.id === props.campaignId) ?? null;
  const segmentLeft = campaign ? (dayIndex(campaign.start) / WAR_DAYS) * 100 : 0;
  const segmentWidth = campaign ? ((dayIndex(campaign.end) - dayIndex(campaign.start)) / WAR_DAYS) * 100 : 0;

  return (
    <footer id="timeline" className="timeline">
      <div className="transport" role="group" aria-label="Playback">
        <button type="button" onClick={() => props.onStep(-1)} disabled={atStart} aria-label="Previous day">
          Prev
        </button>
        <button
          type="button"
          onClick={props.onTogglePlay}
          aria-pressed={props.playing}
          aria-label={props.playing ? "Pause" : "Play"}
          disabled={!props.playing && atEnd}
        >
          {props.playing ? "Pause" : "Play"}
        </button>
        <button type="button" onClick={() => props.onStep(1)} disabled={atEnd} aria-label="Next day">
          Next
        </button>
        <div className="speeds" role="radiogroup" aria-label="Speed">
          {SPEEDS.map((speed) => (
            <button
              key={speed}
              type="button"
              role="radio"
              aria-checked={props.speed === speed}
              aria-label={`${speed} times, ${speed} ${speed === 1 ? "day" : "days"} per second`}
              onClick={() => props.onSpeed(speed)}
            >
              {speed}×
            </button>
          ))}
        </div>
        <button type="button" onClick={props.onOverview} aria-label="Zoom out to country occupation">
          War overview
        </button>
        <p className="readout" id="date-label">
          {formatStencil(props.date)}
          {campaign ? (
            <span className="readout-op">{campaign.name}</span>
          ) : preset ? (
            <span className="readout-op">{preset.name}</span>
          ) : marked ? (
            <span className="readout-op">{marked.name}</span>
          ) : null}
        </p>
      </div>
      <OperationScale date={props.date} campaignId={props.campaignId} onCampaign={props.onCampaign} onPreset={props.onPreset} />
      <div className="scrub">
        <div className="sprockets" aria-hidden="true" />
        {operationTicks().map((tick) => (
          <span key={tick.id} className="scrub-tick" style={{ left: `${(dayIndex(tick.date) / WAR_DAYS) * 100}%` }} />
        ))}
        <span
          className="campaign-window"
          style={{ left: `${campaignLeft}%`, width: `${campaignWidth}%` }}
          title="Normandy campaign, 6 June–31 August 1944"
        />
        {campaign ? (
          <span
            className="segment-window"
            style={{ left: `${segmentLeft}%`, width: `${segmentWidth}%` }}
            title={campaign.note}
          />
        ) : null}
        <span className="sample-window" style={{ left: `${sampleLeft}%` }} title="Normandy sample, 6–13 June 1944" />
        <input
          id="date-slider"
          type="range"
          min={0}
          max={WAR_DAYS}
          value={dayIndex(props.date)}
          aria-labelledby="date-label"
          aria-valuetext={formatDisplay(props.date)}
          onChange={(event) => props.onScrub(Number(event.target.value))}
        />
      </div>
      <div className="ops" aria-label="Campaigns">
        <span className="ops-label">Campaigns</span>
        {CAMPAIGNS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={props.campaignId === item.id ? "true" : undefined}
            aria-label={`${item.name}, ${item.start} to ${item.end}`}
            title={item.note}
            onClick={() => props.onCampaign(item.id)}
          >
            <span>{formatDisplay(item.start)}</span>
            {item.name}
          </button>
        ))}
      </div>
      <div className="ops" aria-label="Normandy campaign presets">
        <span className="ops-label">Normandy</span>
        {CAMPAIGN_PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={props.date === item.date ? "date" : undefined}
            title={item.note}
            onClick={() => {
              if (item.battleId) props.onBattle(item.battleId);
              else props.onPreset(item.date);
            }}
          >
            <span>{formatDisplay(item.date)}</span>
            {item.name}
          </button>
        ))}
      </div>
      <p className="keys-hint">Space plays or pauses. Left and right arrows step one day. F follows the selected unit.</p>
      <p className="range-ends" aria-hidden="true">
        <span>{formatDisplay(WAR_START)}</span>
        <span>{formatDisplay(dateFromIndex(WAR_DAYS))}</span>
      </p>
    </footer>
  );
}
