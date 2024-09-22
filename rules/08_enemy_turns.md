## Enemy Turns

### Determining Enemy Actions

Enemies mostly move and attack predictably. Use the following rules to determine what an enemy will do on their turn. These rules should be followed in order. If rule 1 applies, do not continue to rule 2 or further; if rule 1 does not apply, then move to rule 2 and so on.

1. If an enemy has less than 1/4 of their maximum HP, and they have the ability to move, they will move away from the nearest player. They will only do this if it does not move them closer to another player. (The player(s) may choose the direction if there is a choice.)

2. If an enemy has less than 1/4 of their maximum HP and **cannot move** for any reason, they will heal +1 HP.

3. If an enemy is in attack range of _any_ player, and they have the ability to attack, they will attack (see Enemy Attacking below). If there are multiple players in range, the enemy will decide who to attack following these rules (stop once a valid target is found):

    1. the last player to attack them (if in range)
    2. the closest player (for ranged attacks, diagonals don't count)
    3. (if tied for closest) the weakest player in range (lowest _current_ HP)
    4. (if tied for weakest) the player with the lowest Lift ability level

> Note that your chosen scenario or quest may change these targeting rules!

4. If an enemy has the ability to move, they will move toward a player following these rules (stop once a direction is determined):

    1. the last player to attack them
    2. the closest player to them
    3. (if tied for closest) the weakest player (lowest _current_ HP)
    4. (if tied for weakest) the player with the lowest Lift ability level

5. If none of the above rules apply – or the enemy cannot take any action – then the enemy will either (1) heal +1 HP, or (2) skip their turn.

### Enemy Movement

Enemies move just like players. Their movement statistic should be listed in the enemies table for the given scenario and quest. They cannot move diagonally, and moving takes up their entire turn.

Enemies will never continue moving through a spot with a player, they will always stop. As such, players will never get a passing attack on an enemy.

> If an enemy movement would take them onto an unrevealed spot in some way, that spot remains unrevealed. The enemy will still move through it as normal, continuing on to eventually attack a player.

### Enemy Attacking

Note that these rules apply for all enemies - including bosses - although the bosses do have some special rules that supersede these. (Be sure to read your scenario and quest carefully!)

Each enemy attack will require the players to know the **Average Level (AvgLv)** of all players. To determine this, add all player levels, divide by the number of players and round down. For example, if there are three players with Levels of 3, 5, and 6 then the average player Level will be:

`(3 + 5 + 6) / 3 = 4.7 → 4`

Each enemy will generally attack using its primary attack method (see the Enemies table for your scenario and quest) which will happen very similarly to player attacks (see [Attacking Enemies](06_player_turns.md#attacking-enemies)). Any player may do the enemy's attack flip. If the value is greater than the enemy's target for that ability, then the attack succeeds, but the player may be able to defend. Similar to player attacks, an Ace will allow for a counter attack by the player, and a King will mean double damage from the enemy to the player (unless specified otherwise).

> Some enemies have a secondary attack ability. This may be triggered by distance to a player, hit point levels, etc. Be sure to consult your scenario and quest!

An enemy will receive a +1 bonus to their attack flips for every 5 average Levels of the players. In other words, if the average player Level is 7 all enemies (including bosses) will receive a +1 to their attack flips; if the average player Level is 19 all enemies will receive a +3 to their attack flips.

Assuming a player does not (or fails to) defend a successful attack, they will take damage following the formula for that enemy in the Enemies table for your scenario and quest.

#### Player Defending

Defending an attack is different for players than for enemies, it is not a simple opposed flip. If a player is hit by an enemy attack they may choose to defend using one of the defensive abilities (see the Abilities table for your scenario). In general these flips will need to be successful by reaching (or exceeding) the target for that ability (similar to using any ability).

For example, if a ranged enemy attacks you with a bow and a target of 8, and their attack flip is a 10 it would successfully hit you. You may then attempt to defend using one of the defensive abilities that you are trained in _and which can defend this type of attack_. You might choose the "Block" ability. Flip a card for this defensive attempt, and if you meet or exceed your target for the ability, then you take reduced damage. Read the ability's description for how much the damage is reduced by. Keep in mind that you can take a defensive posture on previous turns to increase your defensive flip value.

> You may use Stamina on these defensive abilities, but you must do so before you flip for the success (or failure) of the ability!

Some defensive abilities may only be used against certain types of attacks. You should read the ability carefully in your chosen scenario. For example, a counter spell defensive capability can only be used to defend against a magical attack.

#### Untrained Defensive Abilities

Players may use defensive abilities they are not trained in. When using them, your level is 1 and the target to succeed is increased using this formula, but with a **minimum increase of +1**:

`(3 - (player level / 5) )`

For example, if you are at level 4, the formula would be `(3 - (4 / 5)) = 3` (note that 4 / 5 is rounded down to 0). Alternatively, if you are at level 12, it would be `(3 - (12 / 5)) = 1`. In these examples, you would add 3 and 1 (respectively) to the target for the defensive ability you are untrained in.

> You may use both the defensive stance and stamina to increase your flip value for untrained defensive abilities.

### Damage and Player Deaths

When an enemy deals damage to a player it is taken off of their current Hit Points (HP). If that number reaches exactly zero, then the player will be stunned indefinitely. When stunned, they can do nothing but defend, move, use items on themselves (and only themselves) until their HP is raised above zero (even just by 1 point).

If a player's HP drops below zero for any reason the player will die. They may be resurrected by certain items or magic, depending on the scenario, but while dead they can take no further actions. Leave the player marker on the spot they died, because all of their items will be dropped there. Any other player may pick them up.

Dead players may also be resurrected at the end of the game session, regardless of the outcome. Essentially, you (the players) can decide if you want to continue to play that character or start over.

Dead players will still receive experience for the current space based on their actions, and they will gain experience from completing the quest should the rest of the party be able to do so without them. Note that **this is only true if the group decides to resurrect them** at the end.

Next > [9. Leaving a Space](09_leaving_a_space.md)
