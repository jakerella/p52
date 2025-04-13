
## Introduction

Word of your first success has impressed the Queen. You believe the Queen will keep her word and reward your party well if you are able to find this amulet, so you venture further into the mountain. Your party soon finds a grand entrance buried deep in the cave - it must be the door to the ancient hall of Purlion, the previous ruling palace. With your combined force you are able to pry the door open just enough to squeeze everyone through.

That's when you hear the rocks outside the door begin to crumble and fall, blocking the door behind you. I suppose there's no way to go but forward now! You've heard of the ancient hall before, in stories. Supposedly, there is a second entrance - your exit - through the hall and up the mountain. Others have found that exit, but it has been locked for centuries. You will need to find the set of two keys that will unlock it!

First, a question: did you return to the castle after the first quest in this scenario?

<!-- CHOICE ["Yes, we went back", "No, we pressed on"] -->

---

<!-- OPTION "Yes, we went back" -->

### Starting Items

Before starting this quest, each character should receive **1 healing potion** and **1 random starting item**.

---

<!-- OPTION "No, we pressed on" -->

### Starting Items

Before starting this quest, each character finds **1 healing potion** in the cave (and that's it).

---

### Quest Rules

* An Ace is a door key, you can collect it by simply being on the space (this is a free action)
* A two of hearts or diamonds is a trap (follow rules in [Space Layout section](../../rules/05_space_layout.md))
* A two of spades or clubs is an enemy
* If a a three appears, the ceiling above partially collapses:
    - the three spot is always blocked (impassable and blocks line of sight)
    - flip an action card: on an 8 or less, the exit is now blocked, reveal the entire space and kill all enemies to allow time to dig it out
    - Regardless of your flip, an enemy drops down from the ceiling, place them on the spot adjacent to the three, toward the exit and add them to the initiative order

---

### Make your way through the Halls

You proceed through the Halls of Purlion. This is a fully interior quest, and every space begins completely dark. All spaces are predefined (see below), and **follow the pattern**: hall -> corridor -> great room. The **pattern then repeats** until you find both keys. Once you have both keys, you have one more room: the stairs (the final exit for the quest is at the end of those stairs). Both keys must be on the exit space for the stairs in order to exit (and complete the quest).

For the layouts below, a `[]` represents a card in the layout, while a `XX` represents an empty spot. The `^` at the bottom is the entrance. The exit is always determined by a flip, see [Space Layout rules](../../rules/05_space_layout.md) **except** for the stairs, where the exit is always at the far end (see diagram).

> For two players, reduce the number of rows on any layout by 2 (in other words, 2 less rows of columns or stairs, etc)

#### Hall Layout

```
[] [] [] [] []
[] XX [] XX []
[] XX [] XX []
[] XX [] XX []
[] XX [] XX []
[] [] [] [] []
      ^
```

#### Corridor Layout

```
XX [] XX
[] [] []
[] [] []
XX [] XX
XX [] XX
[] [] []
[] [] []
XX [] XX
   ^
```

#### Great Room Layout

```
[] [] [] []
[] [] [] []
[] XX XX []
[] XX XX []
[] [] [] []
[] [] [] []
^
```

#### Stairs Layout

> Only used for the _last space_ in the quest. The exit is at the top, represented by a `^`

```
^
[] [] XX XX XX
XX [] [] [] XX
XX XX [] [] []
XX XX XX [] []
XX [] [] [] XX
XX [] [] [] XX
[] [] [] XX XX
[] [] XX XX XX
^
```

<!-- CONFIRM-NEXT "Only proceed if you are done with this quest, there are spoilers ahead!" -->

---

### Conclusion

You exit the ancient ruins, a hard fought, perilous journey to be sure. But you will be stronger for it. Examining the keys you found, you notice the same strange script on the shaft of each key as you saw inside the amulet case. This must be the "old word" that all of the elders in the land speak of. Very few understand it any longer. You wonder if the long-dead words mean anything for your quest...

**Choose a character to attempt to decipher the text**. If that character has the "Scholar" ability they may use it, if not, they may use "Think" with +2 to the target (making it more difficult). The target for success is `(avgLv x 4)`, but the character may use Stamina, and 1 other character may assist them with a Stamina card of their own.

Did you succeed?

<!-- CHOICE ["Yes, we read the text", "No, we failed"] -->

---

<!-- OPTION "No, we failed" -->

#### We failed to read the text

That script was ancient, and not easily seen, let alone read. You gave it a valiant effort though.

* The character performing the deciphering gains `(Lv x 2)` experience
* Any assisting character gains experience equal to their current level

---

<!-- OPTION "Yes, we read the text" -->

#### We read the text!

> **DO NOT** read this if you failed... **SPOILERS!!**

Although some of the text was unreadable from erosion, on the keys they read: "Fury of the f@#*y s-n awaits" and "Prot#$!e% by many, prepare!"

* The character performing the deciphering gains +1 in Think
* The character performing the deciphering gains `(Lv x 3)` experience
* Any assisting character gains `(Lv x 2)` experience

> **If you returned to the castle after the First Quest**, then you cannot read the script in the amulet case, because you left it with the Queen! **SKIP TO THE NEXT SECTION.**

**If you "pressed on" after the First Quest**, then the character also deciphers the text inside the amulet case. It says: "Stone guar*^ the pr@^~*#!ons you seek" Curious, your party looks around the exit from the ruins and finds a hidden cache near the door.

* All characters receive 1 piece of "iron armor." Each player decides what body part it fits on (but once decided, you cannot change it!)

---

### Quest Bonuses

* Each character receives `(4 x Lv)` experience plus [standard quest experience](../../rules/10_experience_and_leveling.md)
* Each character receives +2 levels in Move
* Any living character trained in any magic receives 1 healing potion and **either**: 2 Fire Elixirs or 2 Ice Elixirs
* Any living character _not_ trained in magic receives: 1 healing potion and 1 random item (flip for it like you're opening a chest)
* All characters heal to 90% `(max HP * 0.9)` (those already above 90% do not change)
