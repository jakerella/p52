
### Introduction

The entrance to the glowing lair at the top of the mountain is before you. You can hear the shrieking of beasts inside, but also a faint, low hum, almost like deep growl, but with a cadence that is almost... like a chorus. Regardless, this is your quest, and your party enters the lair to find and defeat the wizard Calico and retrieve the amulet.

---

### Starting Items

Before starting this quest, each character should receive **1 healing potion** and **1 random starting item**.

<!-- determineStartingItem -->

---

### Quest Rules

* The **first** Ace you reveal will be the wizard's apprentice (see below). The exit to the room you are in when this card is revealed is locked until you defeat the apprentice.
    - Any additional Aces in the _same room_ as the apprentice will be a trap.
* The **second** Ace you reveal (in a subsequent room) will be the wizard, Calico (see below). The exit will be locked until you defeat Calico.
    - Any additional Aces you reveal will be a trap.
* A two of hearts or diamonds is a double enemy
* A two of spades or clubs is a chest
* A three of hearts or diamonds a spike pit:
    - when revealed, if the player is _adjacent_ to the pit, they fall in
    - flip an action card: on a 4 or less, you take avgLv damage from the spikes
    - Regardless of your flip, you lose your next turn climbing out (you are now on the pit spot)
    - Any character entering this spot for any reason will fall and must flip and lose a turn
    - Enemies will avoid this spot as if it were blocked
* A three of spades or clubs is a secret passage (see [space layout rules](../../rules/05_space_layout.md))

---

### Proceed

The rooms of the lair follow standard [space layout rules](../../rules/05_space_layout.md). The Lair is all **interior**, and players should flip to see if any one room is lit or dark.

When you encounter the **first Ace**, read on to see how the Apprentice fights. (You should wait until you encounter them!)

---

### The Apprentice

Place a marker on the spot where the apprentice appears (_do not flip a card from the Enemy deck_).

All _currently revealed_ enemies will still move and attack as usual, but **no new enemies appear** in this room. Any spots revealed that would be enemies are empty spots.

* Apprentice will always have the highest initiative and immediately take their turn (then resume previous place in the order)
* Basic Stats:
    - HP: `(AvgLv * 12)`
    - Move: 2
    - -1 to target to defend against any magic
    - +1 to target to defend against any melee attack
* Apprentice varies their attack. Use the [standard move and target rules for enemies](../../rules/08_enemy_turns.md), however:
    - At R=0: staff bonk, target: `(7 - AvgLv)`, damage: `(AvgLv + Over + 3)`
    - At R=1-5: Fire Ball magic, target: `(9 - AvgLv + R)`, damage: `((AvgLv x 2) + Over)`
    - At R>5: no attack (but will move)
* Will never retreat as they fear reprisal from Calico, ignore any instructions for enemies under 1/4 HP to flee

> **Proceed once you defeat the Apprentice!**

---

### Proceed

Keeping going through the lair looking for Calico the Wizard. The rooms of the lair follow standard [space layout rules](../../rules/05_space_layout.md). The Lair is all **interior**, and players should flip to see if any one room is lit or dark.

When you encounter the **second Ace**, read on to see how Calico fights. (You should wait until you encounter them!)

---

### Calico the Wizard

Place a marker on the spot where the apprentice appears (_do not flip a card from the Enemy deck_).

All other enemies will flee immediately (remove them from the table), and **no new enemies appear** in this room. Any spots revealed that would be enemies are empty spots.

* Calico will always have the highest initiative and immediately take their turn, then begin turn order from the top.
* Basic Stats:
    - HP: `(AvgLv * 25)`
    - Move: 2, floating (can go over traps)
    - -1 to target to defend against any magic involving ice or water
    - +1 to target to defend against any melee or non-magic ranged attack
* Calico varies his attack. Use the [standard move and target rules for enemies](../../rules/08_enemy_turns.md), however:
    - At R=0, melee attack with his sharpened metal staff: target: `(10 - AvgLv)`, damage: `((Over x 2) + AvgLv)`
    - At R=1-3, Fire Ball magic, target: `(8 - AvgLv + R)`, damage: `((AvgLv x 3) + Over)`
    - At R=4-5, Calico will move per usual rules
    - At R>5, Calico summons a cave beast to attack the party. The location will be the spot where there character with the most HP (currently, not max) is located.
        - The beast will then attach, in descending HP order, each character within 1 spot of the original target.
        - The beast will attack each character with target: `(11 - AvgLv)` and damage `(AvgLv x 2)`
        - All characters will have a +2 to their target to defend
        - Calico will then **also** move per usual rules
* Calico is weak against ice or water magic, characters' damage will be increased 1.5x
* When under 1/4 HP Calico will retreat per the usual rules, but will also heal:
    - Flip for the amount of HP recovered
* When Calico's HP falls below 0, flip an Action card:
    - if the card is an Ace, Calico vanishes and reappears either at the entrance or exit, whichever is furthest from the nearest character, and heals to 1/4 HP
    - if the card is 2-5, Calico heals to 1/8 HP and moves two spots in a direction taking him away from characters
    - on any other value, Calico is defeated

---

### Conclusion

Calico hisses in pain as he crumples to the cave floor. You all approach him slowly, still on guard. He doesn't move, but you hold your weapon ready as you reach for the amulet held in his hand. It appears he had been using it to summon those creatures and cast the fire ball spell. You nudge him slightly and he flinches! You all jump back, but realize that it was just final muscle spasm of an old man.

You exit the lair, amulet safely in a pouch, and squint as the bright sun shines down on your glorious success!

It takes you a full day and night to get down the Lichanden mountains and through the forest in the foothills. As you pass through the villages below the mountain you are hailed as heroes! The townsfolk have seen that the glow from the mountain is gone, and the beasts that had invaded their lands have all retreated. You rest briefly at a couple of the villages and eat and drink and tell the story of your quest.

After another day of walking you arrive at the castle of Queen Katya of Mioweth and enter her great hall. She is stoic as you approach, but as soon as you reveal the Scarlet Amulet of Lasoor from its pouch, her eyes grow wide and she squeals in delight.

"You are truly heroes!" She exclaims. "Thank you for saving my people. Please, rest here, use any of the castle resources you need, and don't go far... there are other troubles I could use your help with!"

---

### Quest Bonuses

* Each character receives `(5 x Lv)` experience + [standard quest experience](../../rules/10_experience_and_leveling.md)
* Each character heals fully
* Each character receives +1 level in any _two_ core abilities
* Each character gains +1 level in any non-core ability
* Each character receives an item of their choice (literally any item in the table for this scenario)
* The character who dealt the final blow to Calico receives a gift from the Queen: **the Sapphire Amulet**
    - While equipped, character may cast "[Ice Storm](reference_tables.md#abilities)" at level 2
    - While equipped, character may defend against any fire magic with target to defend -2
