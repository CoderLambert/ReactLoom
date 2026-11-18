import type { Atom, PrimitiveAtom, WritableAtom } from 'jotai'
export type Story = { id: string; title: string; read: boolean }
export declare const counterAtom: PrimitiveAtom<number>
export declare const doubleAtom: Atom<number>
export declare const storiesAtom: PrimitiveAtom<readonly Story[]>
export declare const unreadAtom: Atom<number>
export declare const toggleReadAtom: WritableAtom<null, [id: string], void>
