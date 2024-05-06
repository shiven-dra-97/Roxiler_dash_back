const express = require("express")
const mongoose = require('mongoose');
require("dotenv").config()
const cors = require("cors")
const app = express()
app.use(cors())

const port = process.env.PORT || 5000;;
const uri = process.env.DATABASE;






main().catch(err => console.log(err));

async function main() {
    await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    console.log("db connected")
    console.log("Database Name:", mongoose.connection.name);
}



const SalesData = mongoose.model('SalesData', {}, 'salesData');

app.get("/records", async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        const totalRecords = await SalesData.countDocuments();
        const totalPages = Math.ceil(totalRecords / limit);
        const records = await SalesData.find().skip(skip).limit(limit);

        res.json({
            currentPage: page,
            totalPages: totalPages,
            records: records
        });
    } catch (err) {
        console.error("Error fetching records:", err);
        res.status(500).json({ message: "Internal server error" });
    }
})

app.get("/statistics", async (req, res) => {
    try {
        const monthName = req.query.month;
        if (!monthName) {
            return res.status(400).json({ message: "Month is required" });
        }

        const monthMap = {
            "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
            "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12
        };

        const selectedMonth = monthMap[monthName.toLowerCase()];

        const totalSaleAmount = await SalesData.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [{ $month: { $toDate: "$dateOfSale" } }, selectedMonth]
                    },
                    sold: true 
                }
            },
            {
                $group: {
                    _id: null,
                    totalSaleAmount: { $sum: "$price" }
                }
            }
        ]);

        const totalSoldItems = await SalesData.aggregate([
            {
              $match: {
                $expr: {
                  $eq: [{ $month: { $toDate: "$dateOfSale" } }, selectedMonth]
                },
                sold: true
              }
            },
            {
              $count: "totalSoldItems"
            }
          ]);
          
          const  totalNotSoldItems = await SalesData.aggregate([
            {
              $match: {
                $expr: {
                  $eq: [{ $month: { $toDate: "$dateOfSale" } }, selectedMonth]
                },
                sold: false
              }
            },
            {
              $count: "totalNotSoldItems"
            }
          ]);

        res.json({
            totalSaleAmount: totalSaleAmount.length > 0 ? totalSaleAmount[0].totalSaleAmount : 0,
            totalSoldItems: totalSoldItems.length > 0 ? totalSoldItems[0].totalSoldItems: 0,
            totalNotSoldItems: totalNotSoldItems.length > 0 ? totalNotSoldItems[0].totalNotSoldItems : 0,
            
        });
    } catch (err) {
        console.error("Error fetching statistics:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});


app.get("/price-ranges", async (req, res) => {
    try {
        const monthName = req.query.month;
        if (!monthName) {
            return res.status(400).json({ message: "Month is required" });
        }

        const monthMap = {
            "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
            "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12
        };

        const selectedMonth = monthMap[monthName.toLowerCase()];

        const priceRanges = {
            "0-100": 0,
            "101-200": 0,
            "201-300": 0,
            "301-400": 0,
            "401-500": 0,
            "501-600": 0,
            "601-700": 0,
            "701-800": 0,
            "801-900": 0,
            "901-above": 0
        };
        

       const dataByMonth=await SalesData.aggregate([
        {
          $match: {
            $expr: {
              $eq: [{ $month: { $toDate: "$dateOfSale" } },selectedMonth]
            }
          }
        }
      ]);

      dataByMonth.forEach(item => {
        const price = item.price;
        if (price >= 0 && price <= 100) {
            priceRanges["0-100"]++;
        } else if (price >= 101 && price <= 200) {
            priceRanges["101-200"]++;
        } else if (price >= 201 && price <= 300) {
            priceRanges["201-300"]++;
        } else if (price >= 301 && price <= 400) {
            priceRanges["301-400"]++;
        } else if (price >= 401 && price <= 500) {
            priceRanges["401-500"]++;
        } else if (price >= 501 && price <= 600) {
            priceRanges["501-600"]++;
        } else if (price >= 601 && price <= 700) {
            priceRanges["601-700"]++;
        } else if (price >= 701 && price <= 800) {
            priceRanges["701-800"]++;
        } else if (price >= 801 && price <= 900) {
            priceRanges["801-900"]++;
        } else if (price >= 901) {
            priceRanges["901-above"]++;
        }
    });



        res.json({data:priceRanges});
    } catch (err) {
        console.error("Error fetching price ranges:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.get("/pie-chart", async (req, res) => {
    try {
        const monthName = req.query.month;
        if (!monthName) {
            return res.status(400).json({ message: "Month is required" });
        }

        const monthMap = {
            "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
            "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12
        };

        const selectedMonth = monthMap[monthName.toLowerCase()];

        const categoriesCount = await SalesData.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [{ $month: { $toDate: "$dateOfSale" } }, selectedMonth]
                    }
                }
            },
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({ categoriesCount });
    } catch (err) {
        console.error("Error fetching categories count:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});



app.listen(port, () => {
    console.log(`listening on port ${port}`)
}) 
