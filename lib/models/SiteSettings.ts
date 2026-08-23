import mongoose, {
  Schema,
  Document,
} from "mongoose";

/* ============================================================
   BANNER TYPE
============================================================ */

export interface ISiteBanner {
  type: "image" | "video";

  // Used when type === "image"
  image?: string;

  // Used when type === "video"
  video?: string;

  link: string;

  isActive: boolean;
}

/* ============================================================
   SITE SETTINGS
============================================================ */

export interface ISiteSettings extends Document {
  store_name: string;

  logo: string;

  phone: string;

  email: string;

  whatsapp_number: string;

  whatsapp_message: string;

  address: string;

  currency: string;

  social_links: Record<string, string>;

  meta_title: string;

  meta_desc: string;

  banners: ISiteBanner[];

  announcement_bar: {
    text: string;
    isActive: boolean;
  };

  shipping_policy: string;

  return_policy: string;

  about_text: string;

  created_at: Date;

  updated_at: Date;
}

/* ============================================================
   BANNER SCHEMA
============================================================ */

const BannerSchema = new Schema<ISiteBanner>(
  {
    type: {
      type: String,
      enum: ["image", "video"],
      default: "image",
      required: true,
    },

    /*
     * Image URL.
     *
     * Used when:
     *
     * type = "image"
     */
    image: {
      type: String,
      default: "",
    },

    /*
     * Video URL.
     *
     * Used when:
     *
     * type = "video"
     */
    video: {
      type: String,
      default: "",
    },

    /*
     * Optional URL to open when the
     * customer clicks the banner.
     */
    link: {
      type: String,
      default: "",
    },

    /*
     * Whether the banner should be
     * displayed on the storefront.
     */
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  }
);

/* ============================================================
   SITE SETTINGS SCHEMA
============================================================ */

const SiteSettingsSchema =
  new Schema<ISiteSettings>(
    {
      store_name: {
        type: String,
        default: "ShopEase",
      },

      logo: {
        type: String,
        default: "",
      },

      phone: {
        type: String,
        default: "",
      },

      email: {
        type: String,
        default: "",
      },

      whatsapp_number: {
        type: String,
        default: "",
      },

      whatsapp_message: {
        type: String,
        default: "",
      },

      address: {
        type: String,
        default: "",
      },

      currency: {
        type: String,
        default: "$",
      },

      social_links: {
        type: Schema.Types.Mixed,
        default: {},
      },

      meta_title: {
        type: String,
        default: "",
      },

      meta_desc: {
        type: String,
        default: "",
      },

      /* ======================================================
         BANNERS
      ======================================================= */

      banners: {
        type: [BannerSchema],
        default: [],
      },

      /* ======================================================
         ANNOUNCEMENT
      ======================================================= */

      announcement_bar: {
        text: {
          type: String,
          default: "",
        },

        isActive: {
          type: Boolean,
          default: false,
        },
      },

      /* ======================================================
         POLICIES
      ======================================================= */

      shipping_policy: {
        type: String,
        default: "",
      },

      return_policy: {
        type: String,
        default: "",
      },

      about_text: {
        type: String,
        default: "",
      },
    },

    {
      timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    }
  );

/* ============================================================
   MODEL
============================================================ */

export default mongoose.models.SiteSettings ||
  mongoose.model<ISiteSettings>(
    "SiteSettings",
    SiteSettingsSchema
  );