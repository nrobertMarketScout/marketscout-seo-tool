// frontend/src/pages/Matrix.jsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  Star,
  StarOff,
  Settings2,
  ChevronDown,
  ChevronUp,
  ChevronDown as ArrowDown,
} from "lucide-react";
import clsx from "clsx";

/* ────────────────── CONFIG */
const FAV_KEY = "marketscout:favorites";

/* Helpers: favorites in localStorage */
const loadFavorites = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]"));
  } catch {
    return new Set();
  }
};
const saveFavorites = (set) =>
  localStorage.setItem(FAV_KEY, JSON.stringify([...set]));

/* Extract rows even if backend wraps them */
const extractRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  for (const k of ["summary", "data", "rows", "results"])
    if (Array.isArray(payload?.[k])) return payload[k];
  console.error("Matrix.jsx ➜ no rows found in:", payload);
  return [];
};

/* Convert strings like "1,200" or "$4.50" → number (or null) */
const toNum = (val) => {
  if (val == null || val === "" || val === "-") return null;
  if (typeof val === "number") return val;
  const n = Number(String(val).replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : null;
};

/* Ordered list of filter keys */
const FILTER_KEYS = [
  "keyword",
  "location",
  "group",
  "minOpp",
  "maxOpp",
  "minVol",
  "maxVol",
  "minCpc",
  "maxCpc",
  "oppLevel",
  "insights",
];

/* All filters hidden by default */
const DEFAULT_VIS = Object.fromEntries(FILTER_KEYS.map((k) => [k, false]));

/* Custom opportunity-level sort weight */
const oppRank = { High: 3, Med: 2, Low: 1 };

export default function Matrix () {
  /* ───────── DATA */
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  /* Favorites */
  const [favorites, setFavorites] = useState(loadFavorites);

  /* ───────── FILTER STATE */
  const [vis, setVis] = useState(DEFAULT_VIS);
  const [dropdownOpen, setDropdownOpen] = useState(false); // keeps panel open
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [group, setGroup] = useState("");
  const [minOpp, setMinOpp] = useState("");
  const [maxOpp, setMaxOpp] = useState("");
  const [minVol, setMinVol] = useState("");
  const [maxVol, setMaxVol] = useState("");
  const [minCpc, setMinCpc] = useState("");
  const [maxCpc, setMaxCpc] = useState("");
  const [oppLevel, setOppLevel] = useState("");
  const [insightsFilter, setInsightsFilter] = useState([]);

  /* ───────── SORT STATE */
  const [sort, setSort] = useState({ key: null, dir: "asc" });

  /* ───────── FETCH once */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/summary");
        const payload = await res.json();
        const raw = extractRows(payload);

        const withMeta = raw.map((r, idx) => ({
          ...r,
          _rowId: `${r.Keyword || ""}::${r.Location || ""}::${r.Group || ""}::${idx}`,
          insights: [
            r.ThinPack ? "Thin Pack" : null,
            r.LowReviews ? "Low Reviews" : null,
            r.MissingSite ? "Missing Site" : null,
          ].filter(Boolean),
        }));
        setRows(withMeta);
      } catch (err) {
        console.error("Matrix.jsx fetch error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ───────── FILTER helpers */
  const passesNumeric = useCallback((value, min, max) => {
    const num = toNum(value);
    if (num == null) return true;
    if (min !== "" && num < Number(min)) return false;
    if (max !== "" && num > Number(max)) return false;
    return true;
  }, []);

  /* ───────── Derived filtered + sorted rows */
  const processed = useMemo(() => {
    /* 1) Filter */
    let out = rows.filter((r) => {
      if (keyword && !r.Keyword.toLowerCase().includes(keyword.toLowerCase()))
        return false;
      if (
        location &&
        !r.Location.toLowerCase().includes(location.toLowerCase())
      )
        return false;
      if (group && !r.Group.toLowerCase().includes(group.toLowerCase()))
        return false;

      if (!passesNumeric(r.OpportunityScore, minOpp, maxOpp)) return false;
      if (!passesNumeric(r.Volume, minVol, maxVol)) return false;
      if (!passesNumeric(r.CPC, minCpc, maxCpc)) return false;

      if (oppLevel && r.OpportunityLevel !== oppLevel) return false;

      if (
        insightsFilter.length &&
        !insightsFilter.every((i) => r.insights.includes(i))
      )
        return false;

      return true;
    });

    /* 2) Sort */
    if (sort.key) {
      const dir = sort.dir === "asc" ? 1 : -1;
      out = [...out].sort((a, b) => {
        const valA = a[sort.key];
        const valB = b[sort.key];
        /* Numeric columns */
        if (["Volume", "CPC", "OpportunityScore"].includes(sort.key)) {
          return (toNum(valA) - toNum(valB)) * dir;
        }
        /* Opportunity level custom order */
        if (sort.key === "OpportunityLevel") {
          return (oppRank[valA] - oppRank[valB]) * dir;
        }
        /* Fallback string compare */
        return valA.localeCompare(valB) * dir;
      });
    }

    return out;
  }, [
    rows,
    keyword,
    location,
    group,
    minOpp,
    maxOpp,
    minVol,
    maxVol,
    minCpc,
    maxCpc,
    oppLevel,
    insightsFilter,
    passesNumeric,
    sort,
  ]);

  /* ───────── FAVORITES */
  const toggleFav = (id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveFavorites(next);
      return next;
    });
  };

  /* ───────── Column-header sort handler */
  const handleSort = (key) => {
    setSort((prev) => {
      if (prev.key === key) {
        return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      }
      return { key, dir: "asc" };
    });
  };

  /* ───────── Filter dropdown (checkbox list) */
  const FilterToggle = () => {
    const ref = useRef(null);

    /* Close when clicking outside */
    useEffect(() => {
      const handler = (e) =>
        ref.current && !ref.current.contains(e.target) && setDropdownOpen(false);
      window.addEventListener("mousedown", handler);
      return () => window.removeEventListener("mousedown", handler);
    }, []);

    /* Select-all logic */
    const allOn = FILTER_KEYS.every((k) => vis[k]);
    const toggleAll = () =>
      setVis(Object.fromEntries(FILTER_KEYS.map((k) => [k, !allOn])));

    return (
      <div className="relative mb-4">
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center gap-1 text-sm font-medium"
        >
          <Settings2 className="h-4 w-4" />
          Filters
          <ChevronDown
            className={clsx(
              "h-4 w-4 transition-transform",
              dropdownOpen && "rotate-180"
            )}
          />
        </button>

        {dropdownOpen && (
          <div
            ref={ref}
            className="absolute z-10 mt-2 w-56 rounded-2xl bg-white p-4 shadow-lg"
          >
            <label className="mb-3 flex cursor-pointer items-center gap-2 font-semibold">
              <input type="checkbox" checked={allOn} onChange={toggleAll} />
              {allOn ? "Clear All" : "Select All"}
            </label>

            {FILTER_KEYS.map((k) => (
              <label key={k} className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  checked={vis[k]}
                  onChange={() => setVis((p) => ({ ...p, [k]: !p[k] }))}
                />
                <span className="capitalize">{k}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  /* ───────── RENDER */
  if (loading) return <p className="p-4">Loading summary…</p>;

  return (
    <div className="p-4 space-y-4">
      <FilterToggle />

      {/* Filter inputs */}
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
        {vis.keyword && (
          <input
            className="input"
            placeholder="Keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        )}
        {vis.location && (
          <input
            className="input"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        )}
        {vis.group && (
          <input
            className="input"
            placeholder="Group"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          />
        )}

        {vis.minOpp && (
          <input
            type="number"
            min="0"
            className="input"
            placeholder="Min Opp Score"
            value={minOpp}
            onChange={(e) => setMinOpp(e.target.value)}
          />
        )}
        {vis.maxOpp && (
          <input
            type="number"
            min="0"
            className="input"
            placeholder="Max Opp Score"
            value={maxOpp}
            onChange={(e) => setMaxOpp(e.target.value)}
          />
        )}

        {vis.minVol && (
          <input
            type="number"
            min="0"
            className="input"
            placeholder="Min Volume"
            value={minVol}
            onChange={(e) => setMinVol(e.target.value)}
          />
        )}
        {vis.maxVol && (
          <input
            type="number"
            min="0"
            className="input"
            placeholder="Max Volume"
            value={maxVol}
            onChange={(e) => setMaxVol(e.target.value)}
          />
        )}

        {vis.minCpc && (
          <input
            type="number"
            min="0"
            className="input"
            placeholder="Min CPC"
            value={minCpc}
            onChange={(e) => setMinCpc(e.target.value)}
          />
        )}
        {vis.maxCpc && (
          <input
            type="number"
            min="0"
            className="input"
            placeholder="Max CPC"
            value={maxCpc}
            onChange={(e) => setMaxCpc(e.target.value)}
          />
        )}

        {vis.oppLevel && (
          <select
            className="input"
            value={oppLevel}
            onChange={(e) => setOppLevel(e.target.value)}
          >
            <option value="">Opportunity Level</option>
            <option value="High">High</option>
            <option value="Med">Med</option>
            <option value="Low">Low</option>
          </select>
        )}

        {vis.insights && (
          <div className="input flex flex-col">
            <span className="text-xs mb-1">Insights</span>
            {["Thin Pack", "Low Reviews", "Missing Site"].map((lab) => (
              <label key={lab} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={insightsFilter.includes(lab)}
                  onChange={(e) =>
                    setInsightsFilter((prev) =>
                      e.target.checked
                        ? [...prev, lab]
                        : prev.filter((l) => l !== lab)
                    )
                  }
                />
                {lab}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Results table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2"></th>
              <SortableHeader
                onSort={handleSort}
                sort={sort}
                column="Keyword"
              />
              <SortableHeader
                onSort={handleSort}
                sort={sort}
                column="Location"
              />
              <SortableHeader onSort={handleSort} sort={sort} column="Group" />
              <SortableHeader
                onSort={handleSort}
                sort={sort}
                column="Volume"
                numeric
              />
              <SortableHeader
                onSort={handleSort}
                sort={sort}
                column="CPC"
                numeric
              />
              <SortableHeader
                onSort={handleSort}
                sort={sort}
                column="OpportunityScore"
                label="Opportunity"
                numeric
              />
              <SortableHeader
                onSort={handleSort}
                sort={sort}
                column="OpportunityLevel"
                label="Level"
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {processed.map((r) => {
              const fav = favorites.has(r._rowId);
              return (
                <tr key={r._rowId} className="hover:bg-gray-50">
                  <td className="text-center">
                    <button
                      className="text-yellow-500"
                      aria-label={fav ? "Unfavorite" : "Favorite"}
                      onClick={() => toggleFav(r._rowId)}
                    >
                      {fav ? (
                        <Star className="h-4 w-4 fill-current" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                  <Cell>{r.Keyword}</Cell>
                  <Cell>{r.Location}</Cell>
                  <Cell>{r.Group}</Cell>
                  <Cell numeric>{r.Volume ?? "-"}</Cell>
                  <Cell numeric>{r.CPC ?? "-"}</Cell>
                  <Cell numeric>{r.OpportunityScore ?? "-"}</Cell>
                  <Cell>
                    <span
                      className={clsx(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        {
                          "bg-green-100 text-green-800":
                            r.OpportunityLevel === "High",
                          "bg-yellow-100 text-yellow-800":
                            r.OpportunityLevel === "Med",
                          "bg-red-100 text-red-800":
                            r.OpportunityLevel === "Low",
                        }
                      )}
                    >
                      {r.OpportunityLevel}
                    </span>
                  </Cell>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ───────── Helper components */
const SortableHeader = ({ column, label, numeric, sort, onSort }) => {
  const isActive = sort.key === column;
  const dirIcon =
    sort.dir === "asc" ? (
      <ChevronUp className="inline h-3 w-3" />
    ) : (
      <ArrowDown className="inline h-3 w-3" />
    );
  return (
    <th
      onClick={() => onSort(column)}
      className={clsx(
        "cursor-pointer select-none px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-900",
        numeric && "text-right"
      )}
    >
      {label || column}
      {isActive && dirIcon}
    </th>
  );
};

const Cell = ({ children, numeric }) => (
  <td
    className={clsx("px-4 py-2 text-sm", numeric && "text-right font-mono")}
  >
    {children}
  </td>
);

/*
Tailwind .input utility
.input {
  @apply rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200;
}
*/
