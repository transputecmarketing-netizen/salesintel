import { ForwardRefExoticComponent, ComponentPropsWithoutRef, RefAttributes } from 'react';

/**
 * Hairline — the public wrapper around an engine. An engine draws into an svg
 * it is handed and writes its caption to a read-out; this file makes both,
 * dresses the host element, and gives back the two calls a consumer needs.
 *
 * It only ever removes what it added: the svg, the live region, and the
 * attributes the host did not already have.
 */
/** What every figure takes. */
type HairlineOptions = {
    /** How strongly the figure answers the pointer, from 0 (subtle) to 1 (strong). Default 0.5. */
    intensity?: number;
    /** `"auto"` follows the page: an ancestor with class `dark` or `data-theme="dark"`, then the page's `color-scheme`. Default `"auto"`. */
    theme?: "auto" | "light" | "dark";
    /** The accessible name. Each figure has a default description in English. */
    label?: string;
    /** The figure's caption, each time it changes. Called once at mount with the rest caption. */
    onRead?: (text: string) => void;
    /**
     * Walks the figure through its answer on its own, in a loop, until the
     * pointer or focus arrives; it resumes after they leave. Only `true` plays.
     * Under prefers-reduced-motion the figure rests. Default false.
     */
    play?: boolean;
};

/**
 * @lucasmarkes/hairline/react — the thirty-three figures as components.
 *
 * A component renders one empty `<div>` and mounts the figure on it in a
 * layout effect, so on the server the box is there and the drawing is not.
 * It mounts once: a changed option reaches the running figure as `update`,
 * and `onRead` is called through a ref, so an inline function never remounts.
 */
/** The figure's options, plus every `<div>` attribute except `children`. */
type HairlineProps = HairlineOptions & Omit<ComponentPropsWithoutRef<"div">, "children" | keyof HairlineOptions>;
type HairlineComponent = ForwardRefExoticComponent<HairlineProps & RefAttributes<HTMLDivElement>>;
/** A tray of eight cards. The card under the pointer stands up; the arrow keys walk the cards. `intensity` spreads the ripple further from the pulled card. */
declare const Riffle: HairlineComponent;
/** Eighty-one pillars on a plinth that rise around the pointer. `intensity` widens the area that rises. */
declare const Terrain: HairlineComponent;
/** An app window in four layers. Moving across opens the gap; moving down picks a layer. `intensity` opens the layers further. */
declare const Exploded: HairlineComponent;
/** A seven by seven dot matrix that plays a loop, and fades like phosphor where the pointer paints it. `intensity` makes the trail linger longer. */
declare const Phosphor: HairlineComponent;
/** Crates riding a belt through a gate. Hovering slows the clock without stopping it. `intensity` slows it more. */
declare const Slow: HairlineComponent;
/** Blocks on a turntable. A flick across it spins it; it settles on the nearest quarter turn. `intensity` makes the spin coast longer. */
declare const Turntable: HairlineComponent;
/** A sixty-key board. The key under the pointer sinks, and its neighbours follow it down, less the further away. `intensity` widens how far the press reaches. */
declare const Keyboard: HairlineComponent;
/** Four floors beside an open shaft. The pointer's height picks a floor, and the car travels there through the ones between. `intensity` makes the car travel faster. */
declare const Elevator: HairlineComponent;
/** A phone in layers: glass, board, battery, shell. Moving across opens the gap; moving down picks a layer. `intensity` opens the layers further. */
declare const Phone: HairlineComponent;
/** A thin laptop: the pointer's height sets how far the lid stands open, and the lid follows it on a spring. `intensity` lets the lid open wider. */
declare const Laptop: HairlineComponent;
/** A terminal window: the pointer's height scrolls back through its history, and the line under it lifts off the screen. `intensity` spreads the lift over more lines. */
declare const Terminal: HairlineComponent;
/** A rack of twelve blades: the pointer's height pulls the nearest ones out on their rails, the farther the less. `intensity` pulls out more blades. */
declare const Cabinet: HairlineComponent;
/** A commit graph on a board: the commit under the pointer rises, and its history rises after it, the farther back the less. `intensity` raises more of the history. */
declare const Branches: HairlineComponent;
/** A vault door: circling the pointer turns its dial, which coasts and catches every ten; on forty its three bolts draw back. `intensity` lets the dial coast longer. */
declare const Vault: HairlineComponent;
/** A bank of twelve lockers, one ajar at rest: the locker under the pointer opens, and the one open before it swings shut. `intensity` opens the door wider. */
declare const Lockers: HairlineComponent;
/** A stand loupe over a blank ruled sheet: the pointer drags it across, and the rules pass enlarged under the glass with nothing between them. `intensity` magnifies more. */
declare const Loupe: HairlineComponent;
/** A padlock: as the pointer nears, the shackle springs up out of the body and swings open about its long leg. `intensity` swings the shackle further. */
declare const Padlock: HairlineComponent;
/** A patch panel of twenty-four ports: the cable under the pointer lifts, and its neighbours lean away, less the further away. `intensity` spreads the lean over more ports. */
declare const Patch: HairlineComponent;
/** A parabolic dish on a two-axis gimbal: the pointer aims it, and it follows on a spring. `intensity` swings the dish further. */
declare const Dish: HairlineComponent;
/** A wifi router whose antennas lean toward the pointer, the nearest the most and the others less the further away. `intensity` spreads the lean over more antennas. */
declare const Router: HairlineComponent;
/** Three test sieves stacked over a pan: the pointer's height picks one, it rises clear of the stack, and every mesh is bare. `intensity` opens the gap further. */
declare const Sieve: HairlineComponent;
/** A garment rail with seven bare hangers: the pointer brushes them, and each rocks away from it, the nearest most, and settles. `intensity` reaches more hangers. */
declare const Rail: HairlineComponent;
/** A wall socket and a plug lying on the floor at the end of its cord: the pointer draws the plug up toward the socket, and it stops short. `intensity` brings it nearer. */
declare const Plug: HairlineComponent;
/** A question mark built as a solid on a plinth, its dot a loose ball: the hook turns about its stem toward the pointer, and the ball rolls after it. `intensity` turns the hook further. */
declare const Query: HairlineComponent;
/** A filing cabinet of three drawers: the pointer's height picks one, it slides out, and inside are two dividers and nothing between them. `intensity` pulls the drawer further out. */
declare const Drawer: HairlineComponent;
/** An empty wire shopping basket under a bail handle: the pointer tilts it toward itself on a spring, so the bare floor shows, and the handle swings after it, late. `intensity` tilts it further. */
declare const Basket: HairlineComponent;
/** A bar chart with no data: seven flat tabs on its base, before a plate of grid lines. The pointer brushes them, and each lifts a little, the nearest most, and drops back to zero. `intensity` lifts them higher. */
declare const Plot: HairlineComponent;
/** A hub and eight tiles on a grid: the tile under the pointer rises and its link turns solid, and its neighbours rise less. `intensity` raises the tiles higher. */
declare const Hub: HairlineComponent;
/** A hub and four branches of tiles: the path to the leaf under the pointer lights hop by hop, each tile rising in turn. `intensity` makes each hop wait longer. */
declare const Relay: HairlineComponent;
/** Twelve tiles lie crooked round a hub; as the pointer nears it they slide into a tree and the links draw in. `intensity` starts the tree from further away. */
declare const Settle: HairlineComponent;
/** A file of ten crooked lines: the pointer runs the formatter down it, and every line above snaps square to its indent. `intensity` starts the lines more crooked. */
declare const Format: HairlineComponent;
/** A tree of package tiles: the one touched rises, and every package that depends on it rises after it along the links. `intensity` raises them higher. */
declare const Rebuild: HairlineComponent;
/** A call stack of five frames: the pointer's height picks one, and the frames above lift away to open it. `intensity` lifts them further. */
declare const Stack: HairlineComponent;

export { Basket, Branches, Cabinet, Dish, Drawer, Elevator, Exploded, Format, type HairlineProps, Hub, Keyboard, Laptop, Lockers, Loupe, Padlock, Patch, Phone, Phosphor, Plot, Plug, Query, Rail, Rebuild, Relay, Riffle, Router, Settle, Sieve, Slow, Stack, Terminal, Terrain, Turntable, Vault };
