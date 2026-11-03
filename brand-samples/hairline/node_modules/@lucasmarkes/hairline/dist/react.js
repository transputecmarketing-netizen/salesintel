"use client";

// src/react.tsx
import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef
} from "react";
import { basket, branches, cabinet, dish, drawer, elevator, exploded, format, hub, keyboard, laptop, lockers, loupe, padlock, patch, phone, phosphor, plot, plug, query, rail, rebuild, relay, riffle, router, settle, sieve, slow, stack, terminal, terrain, turntable, vault } from "@lucasmarkes/hairline";
import { jsx } from "react/jsx-runtime";
var useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
function make(name, mount) {
  const Component = forwardRef(function Hairline(props, ref) {
    const { intensity, theme, label, onRead, play, style, ...attrs } = props;
    const named = label ?? props["aria-label"];
    const el = useRef(null);
    const figure = useRef(null);
    const read = useRef(onRead);
    const set = useCallback((node) => {
      el.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }, [ref]);
    useIsoLayoutEffect(() => {
      read.current = onRead;
    });
    useIsoLayoutEffect(() => {
      const f = mount(el.current, { intensity, theme, label: named, play, onRead: (text) => read.current?.(text) });
      figure.current = f;
      return () => {
        f.destroy();
        figure.current = null;
      };
    }, []);
    useIsoLayoutEffect(() => {
      figure.current?.update({ intensity, theme, label: named, play });
    }, [intensity, theme, named, play]);
    return /* @__PURE__ */ jsx("div", { ...attrs, ref: set, style: { aspectRatio: "5 / 4", ...style } });
  });
  Component.displayName = name;
  return Component;
}
var Riffle = make("Riffle", riffle);
var Terrain = make("Terrain", terrain);
var Exploded = make("Exploded", exploded);
var Phosphor = make("Phosphor", phosphor);
var Slow = make("Slow", slow);
var Turntable = make("Turntable", turntable);
var Keyboard = make("Keyboard", keyboard);
var Elevator = make("Elevator", elevator);
var Phone = make("Phone", phone);
var Laptop = make("Laptop", laptop);
var Terminal = make("Terminal", terminal);
var Cabinet = make("Cabinet", cabinet);
var Branches = make("Branches", branches);
var Vault = make("Vault", vault);
var Lockers = make("Lockers", lockers);
var Loupe = make("Loupe", loupe);
var Padlock = make("Padlock", padlock);
var Patch = make("Patch", patch);
var Dish = make("Dish", dish);
var Router = make("Router", router);
var Sieve = make("Sieve", sieve);
var Rail = make("Rail", rail);
var Plug = make("Plug", plug);
var Query = make("Query", query);
var Drawer = make("Drawer", drawer);
var Basket = make("Basket", basket);
var Plot = make("Plot", plot);
var Hub = make("Hub", hub);
var Relay = make("Relay", relay);
var Settle = make("Settle", settle);
var Format = make("Format", format);
var Rebuild = make("Rebuild", rebuild);
var Stack = make("Stack", stack);
export {
  Basket,
  Branches,
  Cabinet,
  Dish,
  Drawer,
  Elevator,
  Exploded,
  Format,
  Hub,
  Keyboard,
  Laptop,
  Lockers,
  Loupe,
  Padlock,
  Patch,
  Phone,
  Phosphor,
  Plot,
  Plug,
  Query,
  Rail,
  Rebuild,
  Relay,
  Riffle,
  Router,
  Settle,
  Sieve,
  Slow,
  Stack,
  Terminal,
  Terrain,
  Turntable,
  Vault
};
//# sourceMappingURL=react.js.map