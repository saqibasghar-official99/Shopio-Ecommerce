'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Search,
  Star,
  Eye,
  Trash2,
  MessageSquare,
  User,
  Package,
  Plus,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

import DataTable from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';

import {
  Card,
  CardContent,
} from '@/components/ui/card';

import { Input } from '@/components/ui/input';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Separator } from '@/components/ui/separator';

import { Badge } from '@/components/ui/badge';

import ReviewStars from '@/components/store/ReviewStars';


// ============================================================
// TYPES
// ============================================================

interface ProductInfo {
  id?: string;
  _id?: string;

  name?: string;
  title?: string;

  slug?: string;

  image?: string;

  images?: string[];
}


interface AdminReview {
  id?: string;
  _id?: string;

  product_id?: string;
  productId?: string;

  order_id?: string;
  customer_id?: string;

  product_name?: string;
  product_title?: string;

  product?: ProductInfo;

  name?: string;

  customer_name?: string;
  customerName?: string;

  customer_phone?: string;

  rating: number;

  comment?: string;

  created_at?: string;
  createdAt?: string;

  updated_at?: string;

  is_approved?: boolean;

  verified?: boolean;
  is_verified?: boolean;

  // Admin-created/test review
  is_fake?: boolean;
  source?: string;
}


// ============================================================
// PRODUCT API TYPE
// ============================================================

interface ProductApiResponse {
  success?: boolean;

  data?: ProductInfo[];

  products?: ProductInfo[];

  pagination?: {
    total?: number;
  };
}


// ============================================================
// REVIEWS API TYPE
// ============================================================

interface ReviewsApiResponse {
  success?: boolean;

  data?: AdminReview[];

  message?: string;
}


// ============================================================
// PAGE
// ============================================================

export default function AdminReviewsPage() {

  // ==========================================================
  // REVIEWS STATE
  // ==========================================================

  const [reviews, setReviews] =
    useState<AdminReview[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [total, setTotal] =
    useState(0);

  const [page, setPage] =
    useState(1);

  const [limit] =
    useState(20);

  const [search, setSearch] =
    useState('');

  const [ratingFilter, setRatingFilter] =
    useState('all');

  const [selectedReview, setSelectedReview] =
    useState<AdminReview | null>(null);

  const [deleting, setDeleting] =
    useState<string | null>(null);


  // ==========================================================
  // PRODUCTS STATE
  // ==========================================================

  const [products, setProducts] =
    useState<ProductInfo[]>([]);

  const [productsLoading, setProductsLoading] =
    useState(false);


  // ==========================================================
  // ADD REVIEW DIALOG
  // ==========================================================

  const [addReviewOpen, setAddReviewOpen] =
    useState(false);

  const [addingReview, setAddingReview] =
    useState(false);


  // ==========================================================
  // ADD REVIEW FORM
  // ==========================================================

  const [newReviewProduct, setNewReviewProduct] =
    useState('');

  const [newReviewCustomer, setNewReviewCustomer] =
    useState('');

  const [newReviewRating, setNewReviewRating] =
    useState('5');

  const [newReviewComment, setNewReviewComment] =
    useState('');


  // ==========================================================
  // GET REVIEW ID
  // ==========================================================

  const getReviewId =
    useCallback(
      (review: AdminReview): string => {

        const id =
          review._id ||
          review.id ||
          '';

        return String(id).trim();

      },
      []
    );


  // ==========================================================
  // GET PRODUCT ID
  // ==========================================================

  const getProductId =
    useCallback(
      (product: ProductInfo): string => {

        return String(
          product._id ||
          product.id ||
          ''
        ).trim();

      },
      []
    );


  // ==========================================================
  // GET PRODUCT NAME
  // ==========================================================

  const getProductDisplayName =
    useCallback(
      (product: ProductInfo): string => {

        return (
          product.name ||
          product.title ||
          'Unnamed Product'
        );

      },
      []
    );


  // ==========================================================
  // FETCH ALL PRODUCTS
  // ==========================================================

  const fetchProducts =
    useCallback(async (): Promise<ProductInfo[]> => {

      try {

        setProductsLoading(true);

        const response =
          await fetch(
            '/api/products',
            {
              cache: 'no-store',
            }
          );

        if (!response.ok) {

          throw new Error(
            'Failed to fetch products'
          );
        }

        const result =
          (await response.json()) as ProductApiResponse;

        let productList: ProductInfo[] = [];

        if (Array.isArray(result.data)) {

          productList =
            result.data;

        } else if (
          Array.isArray(result.products)
        ) {

          productList =
            result.products;

        } else if (
          Array.isArray(result)
        ) {

          productList =
            result as unknown as ProductInfo[];

        }

        setProducts(
          productList
        );

        return productList;

      } catch (error) {

        console.error(
          'Failed to fetch products:',
          error
        );

        setProducts([]);

        return [];

      } finally {

        setProductsLoading(false);

      }

    }, []);


  // ==========================================================
  // FETCH REVIEWS
  // ==========================================================

  const fetchReviews =
    useCallback(async () => {

      setLoading(true);

      try {

        // ------------------------------------------------------
        // 1. GET PRODUCTS
        // ------------------------------------------------------

        const productList =
          products.length > 0
            ? products
            : await fetchProducts();


        // ------------------------------------------------------
        // 2. ONLY PRODUCTS HAVING SLUG
        // ------------------------------------------------------

        const productsWithSlugs =
          productList.filter(
            (product) =>
              typeof product.slug === 'string' &&
              product.slug.trim() !== ''
          );


        // ------------------------------------------------------
        // 3. FETCH REVIEWS FOR EACH PRODUCT
        // ------------------------------------------------------

        const reviewRequests =
          productsWithSlugs.map(
            async (product) => {

              try {

                const response =
                  await fetch(
                    `/api/products/${encodeURIComponent(
                      product.slug as string
                    )}/reviews`,
                    {
                      cache: 'no-store',
                    }
                  );

                if (!response.ok) {

                  return [];

                }

                const result =
                  (await response.json()) as ReviewsApiResponse;

                if (
                  !result.success ||
                  !Array.isArray(result.data)
                ) {

                  return [];

                }


                // ------------------------------------------------
                // ATTACH PRODUCT INFORMATION
                // ------------------------------------------------

                return result.data.map(
                  (review) => {

                    const productImage =
                      product.image ||
                      product.images?.[0];


                    const reviewId =
                      review._id ||
                      review.id;


                    return {

                      ...review,

                      id:
                        reviewId,

                      _id:
                        reviewId,

                      product_id:
                        review.product_id ||
                        review.productId,

                      product_name:
                        product.name ||
                        product.title ||
                        'Unknown Product',

                      product_title:
                        product.title ||
                        product.name,

                      product: {

                        id:
                          product.id ||
                          product._id,

                        _id:
                          product._id ||
                          product.id,

                        name:
                          product.name,

                        title:
                          product.title,

                        slug:
                          product.slug,

                        image:
                          productImage,

                      },

                    };

                  }
                );

              } catch (error) {

                console.error(
                  `Failed to fetch reviews for product ${product.slug}:`,
                  error
                );

                return [];

              }

            }
          );


        // ------------------------------------------------------
        // 4. WAIT FOR ALL PRODUCTS
        // ------------------------------------------------------

        const reviewArrays =
          await Promise.all(
            reviewRequests
          );


        // ------------------------------------------------------
        // 5. FLATTEN
        // ------------------------------------------------------

        const allReviews =
          reviewArrays.flat();


        // ------------------------------------------------------
        // 6. SORT NEWEST FIRST
        // ------------------------------------------------------

        allReviews.sort(
          (a, b) => {

            const dateA =
              new Date(
                a.created_at ||
                a.createdAt ||
                0
              ).getTime();

            const dateB =
              new Date(
                b.created_at ||
                b.createdAt ||
                0
              ).getTime();

            return dateB - dateA;

          }
        );


        // ------------------------------------------------------
        // 7. SEARCH
        // ------------------------------------------------------

        let filteredReviews =
          allReviews;

        const searchValue =
          search.trim().toLowerCase();

        if (searchValue) {

          filteredReviews =
            filteredReviews.filter(
              (review) => {

                const productName =
                  (
                    review.product_name ||
                    review.product_title ||
                    review.product?.name ||
                    review.product?.title ||
                    ''
                  ).toLowerCase();

                const customerName =
                  (
                    review.name ||
                    review.customer_name ||
                    review.customerName ||
                    ''
                  ).toLowerCase();

                const comment =
                  (
                    review.comment ||
                    ''
                  ).toLowerCase();

                return (

                  productName.includes(
                    searchValue
                  ) ||

                  customerName.includes(
                    searchValue
                  ) ||

                  comment.includes(
                    searchValue
                  )

                );

              }
            );

        }


        // ------------------------------------------------------
        // 8. RATING FILTER
        // ------------------------------------------------------

        if (ratingFilter !== 'all') {

          const rating =
            Number(
              ratingFilter
            );

          filteredReviews =
            filteredReviews.filter(
              (review) =>
                Number(
                  review.rating
                ) === rating
            );

        }


        // ------------------------------------------------------
        // 9. TOTAL
        // ------------------------------------------------------

        setTotal(
          filteredReviews.length
        );


        // ------------------------------------------------------
        // 10. PAGINATION
        // ------------------------------------------------------

        const startIndex =
          (page - 1) * limit;

        const endIndex =
          startIndex + limit;

        const paginatedReviews =
          filteredReviews.slice(
            startIndex,
            endIndex
          );


        // ------------------------------------------------------
        // 11. SET DATA
        // ------------------------------------------------------

        setReviews(
          paginatedReviews
        );

      } catch (error) {

        console.error(
          'Failed to fetch reviews:',
          error
        );

        setReviews([]);

        setTotal(0);

      } finally {

        setLoading(false);

      }

    }, [
      products,
      fetchProducts,
      page,
      limit,
      search,
      ratingFilter,
    ]);


  // ==========================================================
  // INITIAL PRODUCT LOAD
  // ==========================================================

  useEffect(() => {

    fetchProducts();

  }, [
    fetchProducts,
  ]);


  // ==========================================================
  // FETCH REVIEWS
  // ==========================================================

  useEffect(() => {

    if (products.length > 0) {

      fetchReviews();

    }

  }, [
    fetchReviews,
    products.length,
  ]);


  // ==========================================================
  // RESET ADD REVIEW FORM
  // ==========================================================

  const resetAddReviewForm =
    () => {

      setNewReviewProduct('');

      setNewReviewCustomer('');

      setNewReviewRating('5');

      setNewReviewComment('');

    };


  // ==========================================================
  // OPEN ADD REVIEW
  // ==========================================================

  const openAddReview =
    () => {

      resetAddReviewForm();

      setAddReviewOpen(true);

    };


  // ==========================================================
  // ADD ADMIN / TEST REVIEW
  // ==========================================================

  const addReview =
    async () => {

      // ------------------------------------------------------
      // VALIDATION
      // ------------------------------------------------------

      if (!newReviewProduct) {

        alert(
          'Please select a product.'
        );

        return;

      }


      if (
        !newReviewCustomer.trim()
      ) {

        alert(
          'Please enter a customer name.'
        );

        return;

      }


      if (
        !newReviewComment.trim()
      ) {

        alert(
          'Please enter the review text.'
        );

        return;

      }


      const selectedProduct =
        products.find(
          (product) =>
            getProductId(
              product
            ) ===
            newReviewProduct
        );


      if (!selectedProduct) {

        alert(
          'Selected product was not found.'
        );

        return;

      }


      setAddingReview(true);


      try {

        // ----------------------------------------------------
        // POST ADMIN / TEST REVIEW
        // ----------------------------------------------------

        const response =
          await fetch(
            '/admin/reviews',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              cache: 'no-store',

              body: JSON.stringify({

                productId:
                  newReviewProduct,

                customerName:
                  newReviewCustomer.trim(),

                rating:
                  Number(newReviewRating),

                comment:
                  newReviewComment.trim(),

                is_fake: true,

                source: 'admin',

              }),

            }
          );


        const responseText =
          await response.text();


        let result: {
          success?: boolean;
          message?: string;
          data?: AdminReview;
        } = {};


        try {

          result =
            JSON.parse(
              responseText
            );

        } catch {

          console.error(
            'Invalid add review response:',
            responseText
          );

        }


        if (!response.ok) {

          throw new Error(
            result.message ||
            `Failed to add review. Status: ${response.status}`
          );

        }


        if (
          result.success === false
        ) {

          throw new Error(
            result.message ||
            'Failed to add review.'
          );

        }


        // ----------------------------------------------------
        // SUCCESS
        // ----------------------------------------------------

        setAddReviewOpen(
          false
        );

        resetAddReviewForm();


        // Refresh product/review data
        await fetchReviews();


        alert(
          'Admin/test review added successfully.'
        );

      } catch (error) {

        console.error(
          'Failed to add review:',
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : 'Failed to add review.'
        );

      } finally {

        setAddingReview(false);

      }

    };


  // ==========================================================
  // DELETE REVIEW
  // ==========================================================

  const deleteReview =
    async (
      review: AdminReview
    ) => {

      const reviewId =
        getReviewId(
          review
        );


      console.log(
        'DELETE REVIEW REQUESTED'
      );

      console.log(
        'Review object:',
        review
      );

      console.log(
        'Review ID:',
        reviewId
      );


      if (!reviewId) {

        alert(
          'Review ID is missing.'
        );

        return;

      }


      const confirmed =
        window.confirm(
          'Are you sure you want to delete this review? This action cannot be undone.'
        );


      if (!confirmed) {

        return;

      }


      setDeleting(
        reviewId
      );


      try {

        const deleteUrl =
          `/admin/reviews/${encodeURIComponent(
            reviewId
          )}`;


        console.log(
          'DELETE URL:',
          deleteUrl
        );


        const response =
          await fetch(
            deleteUrl,
            {
              method: 'DELETE',
              cache: 'no-store',
            }
          );


        const responseText =
          await response.text();


        console.log(
          'DELETE STATUS:',
          response.status
        );

        console.log(
          'DELETE RESPONSE:',
          responseText
        );


        let result: {
          success?: boolean;
          message?: string;
          data?: {
            id?: string;
          };
        } = {};


        try {

          result =
            JSON.parse(
              responseText
            );

        } catch {

          console.error(
            'DELETE response was not valid JSON:',
            responseText
          );

        }


        if (!response.ok) {

          throw new Error(
            result.message ||
            `Delete failed with status ${response.status}`
          );

        }


        if (
          result.success === false
        ) {

          throw new Error(
            result.message ||
            'Failed to delete review'
          );

        }


        // ----------------------------------------------------
        // REMOVE FROM UI
        // ----------------------------------------------------

        setReviews(
          (prev) =>
            prev.filter(
              (item) =>
                getReviewId(
                  item
                ) !== reviewId
            )
        );


        setTotal(
          (prev) =>
            Math.max(
              0,
              prev - 1
            )
        );


        // ----------------------------------------------------
        // CLOSE DETAIL DIALOG
        // ----------------------------------------------------

        if (
          selectedReview &&
          getReviewId(
            selectedReview
          ) === reviewId
        ) {

          setSelectedReview(
            null
          );

        }


        console.log(
          'REVIEW DELETED SUCCESSFULLY:',
          reviewId
        );

      } catch (error) {

        console.error(
          'FAILED TO DELETE REVIEW:',
          error
        );


        alert(
          error instanceof Error
            ? error.message
            : 'Failed to delete review'
        );

      } finally {

        setDeleting(
          null
        );

      }

    };


  // ==========================================================
  // HELPERS
  // ==========================================================

  const getProductName =
    (
      review: AdminReview
    ) => {

      return (
        review.product_name ||
        review.product_title ||
        review.product?.name ||
        review.product?.title ||
        'Unknown Product'
      );

    };


  const getCustomerName =
    (
      review: AdminReview
    ) => {

      return (
        review.name ||
        review.customer_name ||
        review.customerName ||
        'Customer'
      );

    };


  const getDate =
    (
      review: AdminReview
    ) => {

      const date =
        review.created_at ||
        review.createdAt;


      if (!date) {

        return '-';

      }


      const parsedDate =
        new Date(
          date
        );


      if (
        Number.isNaN(
          parsedDate.getTime()
        )
      ) {

        return '-';

      }


      return parsedDate.toLocaleDateString(
        undefined,
        {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }
      );

    };


  // ==========================================================
  // TABLE COLUMNS
  // ==========================================================

  const columns =
    useMemo(
      () => [

        // ----------------------------------------------------
        // PRODUCT
        // ----------------------------------------------------

        {
          key: 'product',

          label: 'Product',

          render: (
            row: Record<string, unknown>
          ) => {

            const review =
              row as unknown as AdminReview;


            return (

              <button
                type="button"
                onClick={() =>
                  setSelectedReview(
                    review
                  )
                }
                className="text-left"
              >

                <div className="flex items-center gap-2.5">

                  {review.product?.image ? (

                    <img
                      src={
                        review.product.image
                      }
                      alt={
                        getProductName(
                          review
                        )
                      }
                      className="h-9 w-9 rounded-md object-cover border"
                    />

                  ) : (

                    <div className="h-9 w-9 rounded-md bg-gray-100 flex items-center justify-center">

                      <Package
                        className="h-4 w-4 text-gray-400"
                      />

                    </div>

                  )}


                  <div className="min-w-0">

                    <p className="max-w-[220px] truncate text-xs font-medium text-gray-900 hover:text-green-600">

                      {getProductName(
                        review
                      )}

                    </p>


                    <div className="flex items-center gap-1.5">

                      <p className="text-[10px] text-gray-400">

                        Product Review

                      </p>


                      {review.is_fake && (

                        <Badge
                          variant="secondary"
                          className="h-4 px-1.5 text-[9px]"
                        >

                          Admin

                        </Badge>

                      )}

                    </div>

                  </div>

                </div>

              </button>

            );

          },

        },


        // ----------------------------------------------------
        // CUSTOMER
        // ----------------------------------------------------

        {
          key: 'customer',

          label: 'Customer',

          render: (
            row: Record<string, unknown>
          ) => {

            const review =
              row as unknown as AdminReview;


            return (

              <div className="flex items-center gap-2">

                <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center">

                  <User
                    className="h-3.5 w-3.5 text-gray-500"
                  />

                </div>


                <span className="text-xs text-gray-700">

                  {getCustomerName(
                    review
                  )}

                </span>

              </div>

            );

          },

        },


        // ----------------------------------------------------
        // RATING
        // ----------------------------------------------------

        {
          key: 'rating',

          label: 'Rating',

          render: (
            row: Record<string, unknown>
          ) => {

            const review =
              row as unknown as AdminReview;


            return (

              <div className="flex items-center gap-1.5">

                <ReviewStars
                  rating={
                    review.rating || 0
                  }
                />


                <span className="text-xs font-medium text-gray-700">

                  {review.rating}/5

                </span>

              </div>

            );

          },

        },


        // ----------------------------------------------------
        // REVIEW
        // ----------------------------------------------------

        {
          key: 'comment',

          label: 'Review',

          render: (
            row: Record<string, unknown>
          ) => {

            const review =
              row as unknown as AdminReview;


            return (

              <button
                type="button"
                onClick={() =>
                  setSelectedReview(
                    review
                  )
                }
                className="block max-w-[300px] text-left"
              >

                <p className="truncate text-xs text-gray-600 hover:text-gray-900">

                  {review.comment ||
                    'No written review'}

                </p>

              </button>

            );

          },

        },


        // ----------------------------------------------------
        // STATUS
        // ----------------------------------------------------

        {
          key: 'verified',

          label: 'Status',

          render: (
            row: Record<string, unknown>
          ) => {

            const review =
              row as unknown as AdminReview;


            const approved =
              review.is_approved !== false;


            return (

              <div className="flex flex-col gap-1">

                {approved ? (

                  <Badge
                    className="bg-green-50 text-green-700 border-green-200 text-[10px]"
                  >

                    Approved

                  </Badge>

                ) : (

                  <Badge
                    variant="secondary"
                    className="text-[10px]"
                  >

                    Pending

                  </Badge>

                )}


                {review.is_fake && (

                  <Badge
                    variant="outline"
                    className="text-[9px] w-fit"
                  >

                    Admin/Test

                  </Badge>

                )}

              </div>

            );

          },

        },


        // ----------------------------------------------------
        // DATE
        // ----------------------------------------------------

        {
          key: 'created_at',

          label: 'Date',

          render: (
            row: Record<string, unknown>
          ) => {

            const review =
              row as unknown as AdminReview;


            return (

              <span className="text-xs text-gray-500">

                {getDate(
                  review
                )}

              </span>

            );

          },

        },


        // ----------------------------------------------------
        // ACTIONS
        // ----------------------------------------------------

        {
          key: 'actions',

          label: 'Actions',

          render: (
            row: Record<string, unknown>
          ) => {

            const review =
              row as unknown as AdminReview;


            const reviewId =
              getReviewId(
                review
              );


            return (

              <div className="flex items-center gap-3">

                {/* VIEW */}

                <button
                  type="button"
                  onClick={() =>
                    setSelectedReview(
                      review
                    )
                  }
                  className="text-gray-400 hover:text-gray-700"
                  title="View Review"
                >

                  <Eye
                    className="h-4 w-4"
                  />

                </button>


                {/* DELETE */}

                <button
                  type="button"
                  onClick={() =>
                    deleteReview(
                      review
                    )
                  }
                  disabled={
                    deleting ===
                    reviewId
                  }
                  className="text-red-500 hover:text-red-700 disabled:opacity-50"
                  title="Delete Review"
                >

                  <Trash2
                    className="h-4 w-4"
                  />

                </button>

              </div>

            );

          },

        },

      ],
      [
        deleting,
        selectedReview,
        deleteReview,
        getReviewId,
      ]
    );


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div className="space-y-4">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-lg font-semibold text-gray-900">

            Reviews

          </h1>


          <p className="text-xs text-gray-500 mt-0.5">

            Manage customer reviews and product ratings

          </p>

        </div>


        <div className="flex items-center gap-4">

          <div className="flex items-center gap-2">

            <MessageSquare
              className="h-4 w-4 text-gray-400"
            />


            <span className="text-xs text-gray-500">

              {total} total

            </span>

          </div>


          {/* ADD REVIEW */}



        </div>

      </div>


      {/* ======================================================
          FILTERS
      ====================================================== */}

      <Card>

        <CardContent className="flex flex-wrap items-end gap-3 p-4">


          {/* SEARCH */}

          <div className="space-y-1">

            <label className="text-xs text-gray-500">

              Search

            </label>


            <div className="relative">

              <Search
                className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
              />


              <Input
                placeholder="Product or customer..."
                value={search}
                onChange={(e) => {

                  setSearch(
                    e.target.value
                  );

                  setPage(1);

                }}
                className="h-8 w-56 pl-8 text-xs"
              />

            </div>

          </div>


          {/* RATING */}

          <div className="space-y-1">

            <label className="text-xs text-gray-500">

              Rating

            </label>


            <Select
              value={
                ratingFilter
              }
              onValueChange={(value) => {

                setRatingFilter(
                  value
                );

                setPage(1);

              }}
            >

              <SelectTrigger
                className="h-8 w-36 text-xs"
              >

                <SelectValue />

              </SelectTrigger>


              <SelectContent>

                <SelectItem
                  value="all"
                  className="text-xs"
                >
                  All Ratings
                </SelectItem>


                <SelectItem
                  value="5"
                  className="text-xs"
                >
                  5 Stars
                </SelectItem>


                <SelectItem
                  value="4"
                  className="text-xs"
                >
                  4 Stars
                </SelectItem>


                <SelectItem
                  value="3"
                  className="text-xs"
                >
                  3 Stars
                </SelectItem>


                <SelectItem
                  value="2"
                  className="text-xs"
                >
                  2 Stars
                </SelectItem>


                <SelectItem
                  value="1"
                  className="text-xs"
                >
                  1 Star
                </SelectItem>

              </SelectContent>

            </Select>

          </div>

        </CardContent>

      </Card>


      {/* ======================================================
          TABLE
      ====================================================== */}

      <DataTable
        columns={
          columns
        }
        data={
          reviews as unknown as Record<
            string,
            unknown
          >[]
        }
        loading={
          loading
        }
      />


      {/* ======================================================
          PAGINATION
      ====================================================== */}

      <Pagination
        page={
          page
        }
        limit={
          limit
        }
        total={
          total
        }
        onPageChange={
          setPage
        }
      />


      {/* ======================================================
          ADD REVIEW DIALOG
      ====================================================== */}

      <Dialog
        open={
          addReviewOpen
        }
        onOpenChange={(open) => {

          if (
            addingReview
          ) {

            return;

          }

          setAddReviewOpen(
            open
          );

        }}
      >

        <DialogContent
          className="max-w-md"
        >

          <DialogHeader>

            <DialogTitle className="text-sm font-semibold flex items-center gap-2">

              <Plus
                className="h-4 w-4"
              />

              Add Admin/Test Review

            </DialogTitle>

          </DialogHeader>


          <div className="space-y-4">


            {/* INFO */}

            <div className="rounded-md border bg-gray-50 p-3">

              <div className="flex items-start gap-2">

                <ShieldCheck
                  className="h-4 w-4 text-gray-500 mt-0.5 shrink-0"
                />

                <div>

                  <p className="text-xs font-medium text-gray-800">

                    Admin-created review

                  </p>

                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">

                    This review is marked as an admin/test review and should not be presented as a verified customer purchase.

                  </p>

                </div>

              </div>

            </div>


            {/* PRODUCT */}

            <div className="space-y-1.5">

              <label className="text-xs font-medium text-gray-700">

                Product
                <span className="text-red-500 ml-1">
                  *
                </span>

              </label>


              <Select
                value={
                  newReviewProduct
                }
                onValueChange={
                  setNewReviewProduct
                }
                disabled={
                  productsLoading ||
                  addingReview
                }
              >

                <SelectTrigger
                  className="h-9 text-xs"
                >

                  <SelectValue
                    placeholder={
                      productsLoading
                        ? 'Loading products...'
                        : 'Select product'
                    }
                  />

                </SelectTrigger>


                <SelectContent>

                  {products
                    .filter(
                      (product) =>
                        getProductId(
                          product
                        )
                    )
                    .map(
                      (product) => {

                        const productId =
                          getProductId(
                            product
                          );


                        const productImage =
                          product.image ||
                          product.images?.[0];


                        return (

                          <SelectItem
                            key={
                              productId
                            }
                            value={
                              productId
                            }
                            className="text-xs"
                          >

                            <div className="flex items-center gap-2">

                              {productImage ? (

                                <img
                                  src={
                                    productImage
                                  }
                                  alt=""
                                  className="h-6 w-6 rounded object-cover"
                                />

                              ) : (

                                <div className="h-6 w-6 rounded bg-gray-100 flex items-center justify-center">

                                  <Package
                                    className="h-3 w-3 text-gray-400"
                                  />

                                </div>

                              )}


                              <span>

                                {
                                  getProductDisplayName(
                                    product
                                  )
                                }

                              </span>

                            </div>

                          </SelectItem>

                        );

                      }
                    )}

                </SelectContent>

              </Select>

            </div>


            {/* CUSTOMER NAME */}

            <div className="space-y-1.5">

              <label className="text-xs font-medium text-gray-700">

                Customer Name
                <span className="text-red-500 ml-1">
                  *
                </span>

              </label>


              <Input
                value={
                  newReviewCustomer
                }
                onChange={(e) =>
                  setNewReviewCustomer(
                    e.target.value
                  )
                }
                placeholder="e.g. Ahmed Khan"
                disabled={
                  addingReview
                }
                className="h-9 text-xs"
              />

            </div>


            {/* RATING */}

            <div className="space-y-1.5">

              <label className="text-xs font-medium text-gray-700">

                Rating
                <span className="text-red-500 ml-1">
                  *
                </span>

              </label>


              <Select
                value={
                  newReviewRating
                }
                onValueChange={
                  setNewReviewRating
                }
                disabled={
                  addingReview
                }
              >

                <SelectTrigger
                  className="h-9 text-xs"
                >

                  <SelectValue />

                </SelectTrigger>


                <SelectContent>

                  <SelectItem
                    value="5"
                    className="text-xs"
                  >

                    <div className="flex items-center gap-2">

                      <span>
                        5 Stars
                      </span>

                    </div>

                  </SelectItem>


                  <SelectItem
                    value="4"
                    className="text-xs"
                  >
                    4 Stars
                  </SelectItem>


                  <SelectItem
                    value="3"
                    className="text-xs"
                  >
                    3 Stars
                  </SelectItem>


                  <SelectItem
                    value="2"
                    className="text-xs"
                  >
                    2 Stars
                  </SelectItem>


                  <SelectItem
                    value="1"
                    className="text-xs"
                  >
                    1 Star
                  </SelectItem>

                </SelectContent>

              </Select>

            </div>


            {/* REVIEW */}

            <div className="space-y-1.5">

              <label className="text-xs font-medium text-gray-700">

                Review
                <span className="text-red-500 ml-1">
                  *
                </span>

              </label>


              <textarea
                value={
                  newReviewComment
                }
                onChange={(e) =>
                  setNewReviewComment(
                    e.target.value
                  )
                }
                placeholder="Write the review text..."
                disabled={
                  addingReview
                }
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />

            </div>


            {/* SELECTED PRODUCT PREVIEW */}

            {newReviewProduct && (

              <div className="rounded-md border p-3">

                {(() => {

                  const product =
                    products.find(
                      (item) =>
                        getProductId(
                          item
                        ) ===
                        newReviewProduct
                    );


                  if (!product) {

                    return null;

                  }


                  const productImage =
                    product.image ||
                    product.images?.[0];


                  return (

                    <div className="flex items-center gap-3">

                      {productImage ? (

                        <img
                          src={
                            productImage
                          }
                          alt={
                            getProductDisplayName(
                              product
                            )
                          }
                          className="h-10 w-10 rounded-md object-cover border"
                        />

                      ) : (

                        <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">

                          <Package
                            className="h-4 w-4 text-gray-400"
                          />

                        </div>

                      )}


                      <div>

                        <p className="text-[10px] text-gray-400">

                          Selected Product

                        </p>

                        <p className="text-xs font-medium text-gray-900">

                          {
                            getProductDisplayName(
                              product
                            )
                          }

                        </p>

                      </div>

                    </div>

                  );

                })()}

              </div>

            )}


            {/* ACTIONS */}

            <div className="flex items-center justify-end gap-2 pt-2">

              <button
                type="button"
                onClick={() =>
                  setAddReviewOpen(
                    false
                  )
                }
                disabled={
                  addingReview
                }
                className="h-9 px-3 rounded-md border text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >

                Cancel

              </button>


              <button
                type="button"
                onClick={
                  addReview
                }
                disabled={
                  addingReview ||
                  !newReviewProduct ||
                  !newReviewCustomer.trim() ||
                  !newReviewComment.trim()
                }
                className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 disabled:opacity-50"
              >

                {addingReview ? (

                  <>
                    <Loader2
                      className="h-3.5 w-3.5 animate-spin"
                    />

                    Adding...

                  </>

                ) : (

                  <>
                    <Plus
                      className="h-3.5 w-3.5" 
                    />

                    Add Review

                  </>

                )}

              </button>

            </div>

          </div>

        </DialogContent>

      </Dialog>


      {/* ======================================================
          REVIEW DETAIL
      ====================================================== */}

      <Dialog
        open={
          !!selectedReview
        }
        onOpenChange={(open) =>
          !open &&
          setSelectedReview(
            null
          )
        }
      >

        <DialogContent
          className="max-w-lg"
        >

          <DialogHeader>

            <DialogTitle className="text-sm font-semibold flex items-center gap-2">

              <Star
                className="h-4 w-4 text-yellow-500"
              />

              Customer Review

            </DialogTitle>

          </DialogHeader>


          {selectedReview && (

            <div className="space-y-4">


              {/* PRODUCT */}

              <div className="rounded-md border p-3">

                <div className="flex items-center gap-3">

                  {selectedReview.product?.image ? (

                    <img
                      src={
                        selectedReview
                          .product
                          .image
                      }
                      alt={
                        getProductName(
                          selectedReview
                        )
                      }
                      className="h-12 w-12 rounded-md object-cover border"
                    />

                  ) : (

                    <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center">

                      <Package
                        className="h-5 w-5 text-gray-400"
                      />

                    </div>

                  )}


                  <div className="min-w-0">

                    <p className="text-xs text-gray-400">

                      Product

                    </p>


                    <p className="text-sm font-semibold text-gray-900">

                      {getProductName(
                        selectedReview
                      )}

                    </p>

                  </div>

                </div>

              </div>


              {/* ADMIN/TEST NOTICE */}

              {selectedReview.is_fake && (

                <div className="rounded-md border bg-gray-50 p-3">

                  <div className="flex items-center gap-2">

                    <ShieldCheck
                      className="h-4 w-4 text-gray-500"
                    />

                    <div>

                      <p className="text-xs font-medium text-gray-800">

                        Admin/Test Review

                      </p>

                      <p className="text-[10px] text-gray-500">

                        This review was created from the admin panel.

                      </p>

                    </div>

                  </div>

                </div>

              )}


              <Separator />


              {/* CUSTOMER */}

              <div className="grid grid-cols-2 gap-4">

                <div>

                  <p className="text-[11px] text-gray-400">

                    Customer

                  </p>


                  <p className="text-xs font-medium text-gray-900 mt-0.5">

                    {getCustomerName(
                      selectedReview
                    )}

                  </p>

                </div>


                <div>

                  <p className="text-[11px] text-gray-400">

                    Date

                  </p>


                  <p className="text-xs font-medium text-gray-900 mt-0.5">

                    {getDate(
                      selectedReview
                    )}

                  </p>

                </div>

              </div>


              {/* RATING */}

              <div>

                <p className="text-[11px] text-gray-400 mb-1">

                  Rating

                </p>


                <div className="flex items-center gap-2">

                  <ReviewStars
                    rating={
                      selectedReview.rating
                    }
                  />


                  <span className="text-xs font-semibold text-gray-700">

                    {
                      selectedReview.rating
                    }/5

                  </span>

                </div>

              </div>


              {/* COMMENT */}

              <div>

                <p className="text-[11px] text-gray-400 mb-1">

                  Review

                </p>


                <div className="rounded-md bg-gray-50 border p-3">

                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">

                    {
                      selectedReview.comment ||
                      'No written review provided.'
                    }

                  </p>

                </div>

              </div>


              {/* STATUS */}

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <span className="text-[11px] text-gray-400">

                    Status

                  </span>


                  {selectedReview.is_approved !== false ? (

                    <Badge
                      className="bg-green-50 text-green-700 border-green-200 text-[10px]"
                    >

                      Approved

                    </Badge>

                  ) : (

                    <Badge
                      variant="secondary"
                      className="text-[10px]"
                    >

                      Pending

                    </Badge>

                  )}

                </div>


                <button
                  type="button"
                  onClick={() =>
                    deleteReview(
                      selectedReview
                    )
                  }
                  disabled={
                    deleting ===
                    getReviewId(
                      selectedReview
                    )
                  }
                  className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                >

                  <Trash2
                    className="h-3.5 w-3.5"
                  />

                  Delete Review

                </button>

              </div>

            </div>

          )}

        </DialogContent>

      </Dialog>

    </div>

  );

}