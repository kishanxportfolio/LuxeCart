const express = require('express')
const Product = require('./models/product')
const mongoose = require('mongoose')
const User = require("./models/user");
const bcrypt = require("bcrypt");
const session = require('express-session');
const Cart = require("./models/cart");


mongoose.connect("mongodb+srv://kishan_db:Krishna%40012@cluster0.j40qp2q.mongodb.net/Luxecart") 
  .then(() => console.log('Mongodb Connected'))
  .catch(err => console.log(err));

const app = express()
const port = 3000

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'LuxeCartSecretKey2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

const banner = [
  { title: "Mega Summer Sale", Image: "/imgs/offer/summerbnr.jpg", link: "/shop" },
  { title: "New Fashion Arrivals", Image: "/imgs/offer/mainbnr.jpg", link: "/shop" }
]
const offerCards = [
  { Image: "/imgs/offer/oc1.jpg", title: "Check it out", link: "/shop" },
  { Image: "/imgs/offer/oc2.jpg", title: "Check it out", link: "/shop" },
  { Image: "/imgs/offer/oc3.jpg", title: "Check it out", link: "/shop" },
  { Image: "/imgs/offer/oc4.jpg", title: "Check it out", link: "/shop" },
  { title: "Mens Outfit", Image: "/imgs/offer/moutfit.jpg", discount: 30, link: "/shop" },
  { title: "Mens Casual", Image: "/imgs/offer/mcasual.jpg", discount: 15, link: "/shop" },
  { title: "Mens Formal", Image: "/imgs/offer/mformal.jpg", discount: 25, link: "/shop" },
  { title: "Mens Partywear", Image: "/imgs/offer/mpartywear.jpg", discount: 30, link: "/shop" },
  { title: "Womens Outfit", Image: "/imgs/offer/woutfit.jpg", discount: 30, link: "/shop" },
  { title: "Womens Partywear", Image: "/imgs/offer/wpartywear.jpg", discount: 30, link: "/shop" },
  { title: "Womens Casual", Image: "/imgs/offer/wcaual.jpg", discount: 15, link: "/shop" },
  { title: "Womens Formal", Image: "/imgs/offer/wformal.jpg", discount: 25, link: "/shop" },
  { title: "Gen-Z Outfit", Image: "/imgs/offer/gen1.jpg", discount: 30, link: "/shop" },
  { title: "Gen-Z Partywear", Image: "/imgs/offer/gen2.jpg", discount: 30, link: "/shop" },
  { title: "Gen-Z Hoodies", Image: "/imgs/offer/gen3.jpg", discount: 15, link: "/shop" },
  { title: "Gen-Z Oversize T-Shirt", Image: "/imgs/offer/gen4.jpg", discount: 25, link: "/shop" }
]



app.get('/', (req, res) => {
  res.render('pages/home')
})

app.get("/collection", async (req, res) => {
  const categories = [
    { name: "Women", key: "women" },
    { name: "Men", key: "men" },
    { name: "Gen-Z", key: "genz" }
  ]
  const data = {}
  for (let cat of categories) {
    data[cat.key] = await Product.aggregate([
      { $match: { category: cat.key } },
      { $sample: { size: 4 } } 
    ]);
  }
  res.render("pages/collection", { categories, data })

})

app.get('/collection/:category', async (req, res) => {
  const categories = [
    { name: "Women", key: "women" },
    { name: "Men", key: "men" },
    { name: "Gen-Z", key: "genz" }
  ]
  const data = {}
  for (let cat of categories) {
    if (cat.key === req.params.category) {
      data[cat.key] = await Product.find({ category: cat.key })
    } else {
      data[cat.key] = []
    }
  }
  res.render("pages/collection", { categories, data })
})

app.get('/shop/:category/:type/:subCategory', async (req, res) => {
  const { category, subCategory, type } = req.params
  let query = {
    category,
    subCategory,
    type
  }
  const products = await Product.find(query)
  res.render('pages/shop', {
    products,
    category,
    subCategory,
    type,
    banner,
    offerCards
  })
})

app.get('/shop/:category/:type', async (req, res) => {
  const { category, type } = req.params
  let query = {
    category,
    type
  }
  const products = await Product.find(query)
  res.render('pages/shop', {
    products,
    category,
    type,
    subCategory: "null",
    banner,
    offerCards
  })
})

app.get('/shop/:category', async (req, res) => {
  const { category } = req.params
  let query = {}
  if (category !== 'all') {
    query.category = category
  }
  const products = await Product.find(query)
  res.render('pages/shop', {
    products,
    category,
    subCategory: "null",
    type: "null",
    banner,
    offerCards
  })

})

app.get('/shop', async (req, res) => {
  const women = await Product.find({ category: "women" }).limit(4)
  const men = await Product.find({ category: "men" }).limit(4)
  const genz = await Product.find({ category: "genz" }).limit(4)

  res.render('pages/shop', {
    women,
    men,
    genz,
    banner,
    offerCards,
    category: "all",
    subCategory: "null",
    type: "null"
  })
})

app.get("/product/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      console.log("Product not found!");
      return res.redirect("/shop/all");
    }
    const relatedProducts = await Product.aggregate([
      {
        $match: {
          category: product.category,
          _id: { $ne: product._id }
        }
      },
      { $sample: { size: 4 } }
    ]);
    res.render("pages/productDetails", { product, relatedProducts });
  } catch (err) {
    console.error("Error in Product Details:", err);
    res.redirect("/shop/all");
  }
});


app.get("/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.redirect("/shop/all");

    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { type: { $regex: query, $options: "i" } },
        { subCategory: { $regex: query, $options: "i" } }
      ]
    });
    res.render("pages/shop", {
      products,
      category: `Search: ${query}`,
      currentMaxPrice: 1000
    });
  } catch (err) {
    console.log("Search Error:", err);
    res.redirect("/shop/all");
  }
});

app.get("/signup", (req, res) => {
  res.render("pages/signup")
})
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.send("Password do not match. Please try again.");
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.send("Email already exists. Please login or use a different email.");
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name: name,
      email: email,
      password: hashedPassword
    });

    await newUser.save();

    res.redirect("/login");

  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error. Please try again later.");
  }
});


app.get("/login", (req, res) => {
  res.render("pages/login")
})
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.send("User not found. Please check your email or sign up.");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      req.session.user = {
        id: user._id,
        name: user.name,
        email: user.email
      };

      res.redirect("/");
    } else {
      res.send("Password is incorrect. Please try again.");
    }

  } catch (error) {
    res.status(500).send("Internal Server Error. Please try again later.");
  }
});

app.get("/profile", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login"); 
    }
    
    try {
        const userId = req.session.user.id;
        const cart = await Cart.findOne({ userId });

        res.render("pages/profile", { 
            user: req.session.user, 
            cart: cart || { items: [] } 
        });
    } catch (err) {
        console.error("Profile Error:", err);
        res.redirect("/");
    }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log("Logout Error:", err);
      return res.redirect("/profile");
    }
    res.clearCookie('connect.sid');
    res.redirect("/");
  });
});


app.get("/cart", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  const userId = req.session.user.id;
  try {
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    let total = 0;
    if (cart) {
      cart.items.forEach(item => {
        if (item.productId) { 
          total += item.productId.price * item.quantity;
        }
      });
    }
    res.render("pages/cart", { cart, total });
  } catch (err) {
    console.log(err);
    res.redirect("/");
  }
});

app.get("/cart/update/:id", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const productId = req.params.id;
    const action = req.query.action; 
    const userId = req.session.user.id;

    try {
        let cart = await Cart.findOne({ userId });
        if (cart) {
            const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

            if (itemIndex > -1) {
                if (action === "increase") {
                    cart.items[itemIndex].quantity += 1;
                } else if (action === "decrease") {
                    if (cart.items[itemIndex].quantity > 1) {
                        cart.items[itemIndex].quantity -= 1;
                    } else {
                        cart.items.splice(itemIndex, 1);
                    }
                }
                await cart.save();
            }
        }
        res.redirect("/cart");
    } catch (err) {
        console.log("Cart Update Error:", err);
        res.redirect("/cart");
    }
});


app.post("/add-to-cart/:id", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  const userId = req.session.user.id;
  const productId = req.params.id;

  try {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [{ productId, quantity: 1 }] });
    } else {
      const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += 1;
      } else {
        cart.items.push({ productId, quantity: 1 });
      }
    }
    await cart.save();
    res.redirect("/cart");
  } catch (err) {
    res.redirect("/shop/all");
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
