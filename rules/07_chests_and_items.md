## Chests and Items

Players can get items in a few different ways:

* At the start of a quest
* By opening chests
* From enemy drops
* Via trades with other players
* At the end of quest as a reward
* Or possibly from some scenario-specific ability

### Opening Chests

Opening a chest is the most straight forward way to get an item in the middle of a quest. Attempting to open a chest takes a full turn - even if the attempt is unsuccessful. A chest can be opened in three ways: **lock picking**, **breaking it open**, or a key (although this may be scenario-specific).

To open a chest using the Lock Picking ability, move to the spot with the chest and then take a turn to open it by flipping a card from the Action deck. You will need to meet or exceed your target for the ability (similar to attacking) in order to succeed.

Flipping an Ace results in a **broken lock**, regardless of your level in the ability. When a lock is broken, the chest can only be opened by attacking it (see below). You may attempt to open a chest as many times as you wish, but keep in mind that it takes a full turn each time.

If you flip a King, the chest will also contain a chest key.

### Untrained Lock Picking

If a player is not trained in the Lock Picking ability, they can still use this method using a **Lock Pick item**. Attempting to open a chest with a Lock Pick item consumes the lock pick if you _fail_, thus after the attempt - if unsuccessful - remove the item from your inventory. For this method, each lock pick item you use allows you to use a higher level in the Lock Pick ability. In other words, using a single pick is like having level 1 Lock Picking. Using two pick items is like having level 2 in the ability (1 + 1). You **cannot get above level 3** using this method.

> If you are already trained in the Lock Pick ability, using a lock pick reduces your ability target by -2 (but you can still only use 3 lock picks at a time).

### Revealing the Item

Once a chest is open, you flip two cards from the Action deck and use the card total to determine what item you get. Each scenario will have its own "Chest Items" table. Place any item received in your character's inventory. Note that you do not have to take the item, and if you do not it remains on that spot. There is no limit to the number of items you can hold, unless your scenario or quest says otherwise.

> If both of the cards are the **same suit** in your flips to reveal the item, then you also gain 1 Lock Pick item. (Note that if you used a lock pick to open this chest, that one was consumed, so you stay at the same number in your inventory.)

### Attacking a Chest

If the lock on a chest has been broken - or if you simply choose not to use the Lock Picking ability or a Lock Pick item - you may attack the chest in order to open it. Flip a card from the Action deck, then add that value to: `(Think / 3)`. A **10 or greater** value opens the chest, a **4 or less** destroys the chest and any item in it. A flip of a King will reveal a chest key in addition to the chest item. On a flip of an Ace, the chest explodes and you take `(2 x Lv)` HP of damage.

> You may use Stamina to increase your flip value when attacking a chest!

### Equipping (and Unequipping) Items

On your turn you can choose to equip (or remove) an item that is not consumable, like a piece of armor or a weapon (but not a potion). This is a free action, and you can equip as many items as you want, but you may only do it once. In other words, you may _not_ equip, move, then equip again in the same turn (but you could move and then equip an item).

Note that **only equipped items** grant the player their bonus! In other words, the defensive bonus of a helmet is only applied if it is equipped. You cannot have more than one item equipped on the same body part, and you should be sensible about other items. For example, you may be able to have a light sword and a knife equipped, but certainly not a battle ax and long staff. Consider equipping what you would be holding in your hands or easily accessible (like a knife), not what is in your satchel.

You may choose to unequip an item you have previously equipped using this same process (note that you would do this in the same free action, you still can't equip or unequip twice in one turn). Any removed item goes back into your inventory.

#### Item Weight

Only **equipped item** weights affect your character. Otherwise, for simplicity sake, you can carry as many items as you like. For equipped items, take the total weight as specified in the scenario's items table and divide by your `(Lift x Balance)` core attributes. Round down as usual (possibly down to zero), this is the **negative impact to your movement**. In other words, if you carry a lot of stuff, your movement will be limited!

This means if you carry enough stuff you may have zero or negative movement. You can still take any non-movement actions, but until you unequip one or more items (and thus lose their bonus or effect), you will not be able to move.

For example, let's say you have Lift 4, Balance 2, and Move 5, and you have two pieces of armor (weights 2 and 3) and a heavy sword (weight 4) equipped. Your base Movement is `((5 / 4) + 1) = 2`,  and your total equipped weight is `(2 + 3 + 4) = 9`. The impact of your equipped items is `Weight / (Lift x Balance)` which is `(9 / (4 x 2)) = 1`. This impact means your actual Movement will be `(2 - 1) = 1`

> ##### Advanced Rule
> 
> Remember, at its core this is a role playing game! So if you and your fellow players want, you can enact a carry-limit rule. For example, you might say that a character may only carry a maximum of `(Lift x Balance) x 2` items. If you do this, be sure to include non-equipped items in your calculation!


---

Next > [8. Enemy Turns](08_enemy_turns.md)
