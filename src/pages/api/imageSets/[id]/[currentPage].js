import dbConnect from "../../../../lib/dbConnect";
import ImageSet from "@/models/ImageSet";

export default async function handler(req, res) {
  const {
    query: { id, currentPage },
    method,
  } = req;

  await dbConnect();

  switch (method) {
    case "GET" /* Get imageSet by ID and return only relevant page */:
      try {
        // Fetch setType and images.length to determine pageLimit
        const setMeta = await ImageSet.findOne(
          { _id: id },
          { setType: 1, images: 1 }
        );
        if (!setMeta) {
          return res.status(400).json({ success: false });
        }
        let pageLimit;
        if (setMeta.images.length === 64) {
          pageLimit = 16;
        } else if (
          setMeta.setType === "3cv" ||
          setMeta.images.length === 2197
        ) {
          pageLimit = 13;
        } else if (req.query.isCardSet === "true") {
          pageLimit = 26;
        } else {
          pageLimit = 100;
        }

        // Helper function to sort cards properly
        const getCardSortValue = (name) => {
          if (!name) return "";

          const cardOrder = {
            A: 1,
            2: 2,
            3: 3,
            4: 4,
            5: 5,
            6: 6,
            7: 7,
            8: 8,
            9: 9,
            10: 10,
            J: 11,
            Q: 12,
            K: 13,
          };
          const suitOrder = {
            "♥": 1,
            "♥️": 1,
            "♦": 2,
            "♦️": 2,
            "♣": 3,
            "♣️": 3,
            "♠": 4,
            "♠️": 4,
          };

          // Match card patterns: value + suit
          const cardPattern = /(A|[2-9]|10|J|Q|K)(♠️?|♥️?|♦️?|♣️?)/g;
          const matches = [...name.matchAll(cardPattern)];

          if (matches.length === 0) {
            return name.toLowerCase();
          }

          // For card sets, sort by: card1 suit, card1 value, card2 suit, card2 value
          let sortValue = "";
          for (const match of matches) {
            const value = match[1];
            const suit = match[2];
            const valueNum = cardOrder[value] || 0;
            const suitNum = suitOrder[suit] || 0;
            // All cards: suit then value
            sortValue += suitNum + valueNum.toString().padStart(2, "0");
          }

          return sortValue;
        };

        const imageSet = await ImageSet.findOne(
          { _id: id },
          { images: 1, setType: 1, name: 1 }
        );
        if (!imageSet) {
          return res.status(400).json({ success: false });
        }

        console.log("isCardSet query param:", req.query.isCardSet);
        console.log(
          "First 5 images before sort:",
          imageSet.images.slice(0, 5).map((i) => i.name)
        );

        // Sort images for card sets
        if (req.query.isCardSet === "true" && imageSet.images) {
          // Debug first few cards
          const testCards = imageSet.images.slice(0, 10).map((img) => {
            const name = img.name || img.imageItem || "";
            return { name, sortValue: getCardSortValue(name) };
          });
          console.log("First 10 cards with sort values:", testCards);

          imageSet.images.sort((a, b) => {
            const aVal = getCardSortValue(a.name || a.imageItem || "");
            const bVal = getCardSortValue(b.name || b.imageItem || "");
            if (aVal < bVal) return -1;
            if (aVal > bVal) return 1;
            return 0;
          });
        }

        console.log(
          "First 5 images after sort:",
          imageSet.images.slice(0, 5).map((i) => i.name)
        );

        // Paginate after sorting
        const paginatedImages = imageSet.images.slice(
          currentPage * pageLimit,
          currentPage * pageLimit + pageLimit
        );

        res.status(200).json({
          success: true,
          data: { ...imageSet.toObject(), images: paginatedImages },
        });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;

    case "PUT" /* Update only the images where we have an image with matching ID */:
      try {
        const updateOperations = [
          {
            updateOne: {
              filter: { _id: id },
              update: { $set: { name: req.body.name } },
            },
          },
          ...req.body.images.map((image) => ({
            updateOne: {
              filter: { _id: id, "images._id": image._id },
              update: { $set: { "images.$": image } },
            },
          })),
        ];

        const changes = await ImageSet.bulkWrite(updateOperations);

        if (!changes) {
          return res.status(400).json({ success: false });
        }
        res.status(200).json({ success: true, data: changes });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;

    default:
      res.status(400).json({ success: false });
      break;
  }
}
