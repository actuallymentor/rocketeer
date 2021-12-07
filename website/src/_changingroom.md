## What is the changing room?

The changing room is a web interface where, once a month, you are able to regenerate your Rocketeer's outfit. This will change the colors to something close to their traits, but different than their current look.

## What does the changing room cost?

It is free. Including free of gas fees. All activity is signed with your wallet, but entirely off chain.

## Does the changing room change traits?

The changing room does not change the current traits like helmet or patch type, but it adds the trait "available outfits" and "last outfit change" which will update with every changing room use. The rarity of these traits will depend on how often you use the changing room.

## How random are the new outfit colors?

The colors are based on the static color traits of your Rocketeer. With each use of the changing room, your Rocketeer gets more adventurous with their outfit. That is to say that color randomness increases with every outfit you generate.

## Do special editions get special treatment?

Yes. All special editions (genesis, hitchhiker, generous, glitched) have more randomness in their new outfits than regular versions.

Additionally, glitched Rocketeers will have access to their old glitched appearance and their updated appearance in the changing room.

## Must I use the new outfit?

That is your choice, you may set your Rocketeer's outfit to any of their available outfits. Changing the outfit does not cost any gas and you can change them as often as you want.

## How are changes generated?

Every new Rocketeer is given colors in RGB values. After their image is generated, the Oracle guesses the human pronouncable name of the RGB color.

For example if your Rocketeer has a helmet of rgb( 255, 10, 4 ) then the trait the Oracle guessed is "red".

The changing room translates the human readable color back to a reasonably close RGB value. "Red" could for example become rgb( 255, 99, 71 ) which is "tomato red", but it could also become rgb( 240, 128, 128 ) which is "coral red".
