import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/user.model.js';
import Outlet from '../models/outlet.model.js';
import MenuItem from '../models/menuItem.model.js';
import Order from '../models/order.model.js';
import PartyOrder from '../models/partyOrder.model.js';
import LoyaltyAccount from '../models/loyaltyAccount.model.js';

const BCRYPT_ROUNDS = Number.parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
const KITCHEN_PASSWORD = 'Kitchen@123';
const CATERING_PASSWORD = 'Catering@123';
const DEMO_ORDER_PREFIX = 'DEMO-HIST-';
const DEMO_PARTY_PREFIX = 'DEMO-PARTY-';

const demoCustomers = [
  { name: 'Aarav Mehta', mobile: '9899000001', email: 'aarav.mehta.demo@Company A.test', pincode: '500081' },
  { name: 'Ananya Rao', mobile: '9899000002', email: 'ananya.rao.demo@Company A.test', pincode: '500032' },
  { name: 'Rohan Sharma', mobile: '9899000003', email: 'rohan.sharma.demo@Company A.test', pincode: '500034' },
  { name: 'Priya Nair', mobile: '9899000004', email: 'priya.nair.demo@Company A.test', pincode: '500016' },
  { name: 'Ishaan Reddy', mobile: '9899000005', email: 'ishaan.reddy.demo@Company A.test', pincode: '500003' },
  { name: 'Meera Kulkarni', mobile: '9899000006', email: 'meera.kulkarni.demo@Company A.test', pincode: '500074' },
  { name: 'Kabir Joshi', mobile: '9899000007', email: 'kabir.joshi.demo@Company A.test', pincode: '500060' },
  { name: 'Saanvi Iyer', mobile: '9899000008', email: 'saanvi.iyer.demo@Company A.test', pincode: '500089' },
  { name: 'Vihaan Patel', mobile: '9899000009', email: 'vihaan.patel.demo@Company A.test', pincode: '500049' },
  { name: 'Diya Menon', mobile: '9899000010', email: 'diya.menon.demo@Company A.test', pincode: '500039' },
];

const toRadians = (value) => (value * Math.PI) / 180;

const distanceKm = (a, b) => {
  if (a?.lat == null || a?.lng == null || b?.lat == null || b?.lng == null) {
    return Number.POSITIVE_INFINITY;
  }

  const earthRadiusKm = 6371;
  const latDiff = toRadians(b.lat - a.lat);
  const lngDiff = toRadians(b.lng - a.lng);
  const value =
    Math.sin(latDiff / 2) ** 2 +
    Math.cos(toRadians(a.lat)) *
      Math.cos(toRadians(b.lat)) *
      Math.sin(lngDiff / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

const getCoordinates = (value) => ({
  lat: Number(value?.lat),
  lng: Number(value?.lng),
});

const selectCustomerLocations = (outlets) => {
  const remaining = new Set(outlets.map((_, index) => index));
  const selected = [];

  while (remaining.size > 0) {
    let bestOutletIndex = -1;
    let bestCoverage = [];

    for (let candidateIndex = 0; candidateIndex < outlets.length; candidateIndex += 1) {
      const candidateCoordinates = getCoordinates(outlets[candidateIndex].coordinates);

      const coverage = [...remaining].filter((outletIndex) => {
        const target = outlets[outletIndex];

        return (
          distanceKm(candidateCoordinates, getCoordinates(target.coordinates)) <=
          Number(target.deliveryRadius || 0)
        );
      });

      if (coverage.length > bestCoverage.length) {
        bestOutletIndex = candidateIndex;
        bestCoverage = coverage;
      }
    }

    if (bestOutletIndex === -1 || bestCoverage.length === 0) break;

    selected.push(outlets[bestOutletIndex]);
    bestCoverage.forEach((index) => remaining.delete(index));
  }

  return selected;
};

const getReferenceId = (value) => {
  if (value === null || value === undefined) return '';
  return String(value?._id || value?.id || value);
};

const getOutletAvailability = (item, outletId) =>
  (item.outletAvailability || []).find((entry) => {
    const reference = entry.outlet ?? entry.outletId ?? entry.outlet_id;
    return getReferenceId(reference) === getReferenceId(outletId);
  });

const getMenuForOutlet = (menuItems, outletId, includeUnavailable = false) =>
  menuItems.filter((item) => {
    const belongsToOutlet = (item.outlets || []).some(
      (reference) => getReferenceId(reference) === getReferenceId(outletId)
    );

    const outletAvailability = getOutletAvailability(item, outletId);

    if (!belongsToOutlet) return false;
    if (includeUnavailable) return true;

    return item.isAvailable !== false && outletAvailability?.isAvailable !== false;
  });

const syncMenuAssignments = async (menuItems, outlets) => {
  const outletIds = outlets.map((outlet) => outlet._id);

  const restrictedPrawnSlugs = new Set([
    'kondapur',
    'gachibowli-cloud-kitchen',
    'banjara-hills',
    'madhapur',
  ]);

  const restrictedPrawnIds = outlets
    .filter((outlet) => restrictedPrawnSlugs.has(outlet.slug))
    .map((outlet) => outlet._id);

  let updatedCount = 0;

  for (const item of menuItems) {
    const intendedOutlets =
      item.name === 'Prawn Biryani' ? restrictedPrawnIds : outletIds;

    const currentIds = (item.outlets || []).map(getReferenceId);
    const intendedIds = intendedOutlets.map(getReferenceId);

    const isCorrect =
      currentIds.length === intendedIds.length &&
      intendedIds.every((id) => currentIds.includes(id));

    if (!isCorrect) {
      item.outlets = intendedOutlets;
      await item.save();
      updatedCount += 1;
    }
  }

  return updatedCount;
};

const makeStatusHistory = (status, placedAt, updatedBy) => {
  const history = [{ status: 'placed', timestamp: placedAt }];

  const steps = {
    confirmed: ['confirmed'],
    preparing: ['confirmed', 'preparing'],
    ready: ['confirmed', 'preparing', 'ready'],
    picked_up: ['confirmed', 'preparing', 'ready', 'picked_up'],
    delivered: ['confirmed', 'preparing', 'ready', 'delivered'],
  };

  (steps[status] || []).forEach((step, index) => {
    history.push({
      status: step,
      timestamp: new Date(placedAt.getTime() + (index + 3) * 60 * 1000),
      ...(updatedBy ? { updatedBy } : {}),
    });
  });

  return history;
};


const upsertStaffUser = async ({ outlet, role, passwordHash, index }) => {
  const isKitchen = role === 'kitchen';
  const email = `${role}.${outlet.slug}@companya.in`;
  const existing = await User.findOne({ email });

  const getAvailableMobile = async () => {
    const base = isKitchen ? 9100000000 : 9200000000;
    let mobileNumber = base + index;

    while (await User.exists({ mobile: String(mobileNumber) })) {
      mobileNumber += 1;
    }

    return String(mobileNumber);
  };

  if (existing) {
    existing.name = `${isKitchen ? 'Kitchen' : 'Catering Manager'} - ${outlet.name}`;
    existing.role = role;
    existing.outlet = outlet._id;
    existing.adminPassword = passwordHash;
    existing.isActive = true;

    if (!existing.mobile) {
      existing.mobile = await getAvailableMobile();
    }

    await existing.save();
    return existing;
  }

  const mobile = await getAvailableMobile();

  return User.create({
    name: `${isKitchen ? 'Kitchen' : 'Catering Manager'} - ${outlet.name}`,
    email,
    mobile,
    role,
    outlet: outlet._id,
    adminPassword: passwordHash,
    isActive: true,
  });
};


const seed = async () => {
  try {
    await connectDB();

    const outlets = await Outlet.find({ isActive: true }).sort({ slug: 1 });

    if (outlets.length !== 17) {
      throw new Error(
        `Expected 17 active outlets, found ${outlets.length}. Run your existing outlet/base seed first.`
      );
    }

    const menuItems = await MenuItem.find({});

    if (menuItems.length === 0) {
      throw new Error('No menu items found. Run your existing menu/base seed first.');
    }

    for (const outlet of outlets) {
      if (outlet.coordinates?.lat == null || outlet.coordinates?.lng == null) {
        throw new Error(
          `Outlet ${outlet.name} is missing coordinates. Delivery history cannot be generated safely.`
        );
      }
    }

    const repairedMenuMappings = await syncMenuAssignments(menuItems, outlets);

    if (repairedMenuMappings > 0) {
      console.log(`Repaired outlet assignments for ${repairedMenuMappings} menu items.`);
    }

    const menuByOutlet = new Map();

    for (const outlet of outlets) {
      const currentlyAvailable = getMenuForOutlet(menuItems, outlet._id);

      const historicalMenu = currentlyAvailable.length
        ? currentlyAvailable
        : getMenuForOutlet(menuItems, outlet._id, true);

      if (!historicalMenu.length) {
        throw new Error(
          `No menu items could be assigned to ${outlet.name}. Check the MenuItem.outlets field.`
        );
      }

      menuByOutlet.set(String(outlet._id), historicalMenu);

      if (!currentlyAvailable.length) {
        console.warn(
          `No currently available menu items at ${outlet.name}; using assigned menu items for historical demo records only.`
        );
      }
    }

    console.log(
      'Creating/updating 17 kitchen accounts and 17 catering manager accounts...'
    );

    const [kitchenHash, cateringHash] = await Promise.all([
      bcrypt.hash(KITCHEN_PASSWORD, BCRYPT_ROUNDS),
      bcrypt.hash(CATERING_PASSWORD, BCRYPT_ROUNDS),
    ]);

    const kitchenUsers = [];
    const cateringUsers = [];

    for (let index = 0; index < outlets.length; index += 1) {
      const outlet = outlets[index];

      kitchenUsers.push(
        await upsertStaffUser({
          outlet,
          role: 'kitchen',
          passwordHash: kitchenHash,
          index,
        })
      );

      cateringUsers.push(
        await upsertStaffUser({
          outlet,
          role: 'catering_manager',
          passwordHash: cateringHash,
          index,
        })
      );
    }

    console.log('Preparing 10 demo customer accounts and deliverable addresses...');

    const coverageLocations = selectCustomerLocations(outlets);

    if (coverageLocations.length > demoCustomers.length) {
      throw new Error(
        `The current delivery radii require at least ${coverageLocations.length} customer locations to cover all outlets; only 10 demo users were requested.`
      );
    }

    const customerLocations = [...coverageLocations];

    for (const outlet of outlets) {
      if (customerLocations.length >= demoCustomers.length) break;

      if (
        !customerLocations.some(
          (entry) => String(entry._id) === String(outlet._id)
        )
      ) {
        customerLocations.push(outlet);
      }
    }

    const customers = [];

    for (let index = 0; index < demoCustomers.length; index += 1) {
      const details = demoCustomers[index];
      const anchorOutlet = customerLocations[index % customerLocations.length];
      const coordinates = getCoordinates(anchorOutlet.coordinates);

      const user = await User.findOneAndUpdate(
        { mobile: details.mobile },
        {
          $set: {
            name: details.name,
            email: details.email,
            role: 'customer',
            address: {
              area: anchorOutlet.name,
              city: anchorOutlet.city || 'Hyderabad',
              pincode:
                anchorOutlet.address?.match(/(\d{6})\s*$/)?.[1] ||
                details.pincode,
              coordinates,
            },
            isProfileComplete: true,
            isActive: true,
          },
          $setOnInsert: {
            loyaltyPoints: 0,
            marketingOptIn: false,
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      customers.push(user);
    }

    const staffByOutletId = new Map(
      cateringUsers.map((user) => [String(user.outlet), user])
    );

    console.log('Removing only this script’s previous demo history...');

    await Promise.all([
      Order.deleteMany({
        orderId: { $regex: `^${DEMO_ORDER_PREFIX}` },
      }),
      PartyOrder.deleteMany({
        partyOrderId: { $regex: `^${DEMO_PARTY_PREFIX}` },
      }),
    ]);

    console.log('Creating historical delivery orders for all 17 outlets...');

    const orderDocs = [];
    const orderStatuses = ['delivered', 'delivered', 'picked_up', 'delivered'];
    const paymentMethods = ['upi', 'card', 'cod'];

    let orderSequence = 1;

    for (let outletIndex = 0; outletIndex < outlets.length; outletIndex += 1) {
      const outlet = outlets[outletIndex];

      const eligibleCustomers = customers
        .map((customer) => ({
          customer,
          distance: distanceKm(
            getCoordinates(customer.address?.coordinates),
            getCoordinates(outlet.coordinates)
          ),
        }))
        .filter(
          ({ distance }) =>
            distance <= Number(outlet.deliveryRadius || 0)
        )
        .sort((a, b) => a.distance - b.distance);

      if (eligibleCustomers.length === 0) {
        throw new Error(
          `No demo customer is deliverable from ${outlet.name}; no order was created for it.`
        );
      }

      const outletMenu = menuByOutlet.get(String(outlet._id));

      for (let historyIndex = 0; historyIndex < 3; historyIndex += 1) {
        const customer =
          eligibleCustomers[
            (outletIndex + historyIndex) % eligibleCustomers.length
          ].customer;

        const menuItem =
          outletMenu[(outletIndex + historyIndex) % outletMenu.length];

        const quantity = 1 + ((outletIndex + historyIndex) % 2);
        const subtotal = Number(menuItem.price) * quantity;
        const gstAmount = Math.round((subtotal * 5) / 105);
        const placedAt = new Date(
          Date.now() - (10 + orderSequence * 19) * 60 * 60 * 1000
        );

        const status =
          orderStatuses[(outletIndex + historyIndex) % orderStatuses.length];

        const prepMinutes = Math.max(
          Number(menuItem.avgPrepTime || 15),
          Number(outlet.minimumPrepTime || 20)
        );

        const orderId = `${DEMO_ORDER_PREFIX}${String(orderSequence).padStart(4, '0')}`;

        orderDocs.push({
          orderId,
          customer: customer._id,
          outlet: outlet._id,
          items: [
            {
              menuItem: menuItem._id,
              name: menuItem.name,
              quantity,
              unitPrice: Number(menuItem.price),
              totalPrice: subtotal,
              addOns: [],
            },
          ],
          subtotal,
          gstAmount,
          discountAmount: 0,
          loyaltyPointsUsed: 0,
          loyaltyPointsEarned: Math.floor(subtotal / 10),
          total: subtotal,
          payment: {
            method: paymentMethods[orderSequence % paymentMethods.length],
            status: 'paid',
            transactionId: `TXN-${orderId}`,
            paidAt: placedAt,
          },
          deliveryType: 'delivery',
          deliveryAddress: {
            street: `${customer.address.area}, Hyderabad`,
            city: customer.address.city || 'Hyderabad',
            pincode: customer.address.pincode,
          },
          status,
          prepTimeEstimate: prepMinutes,
          aiEstimatedPrepTime: Number(menuItem.avgPrepTime || prepMinutes),
          promisedAt: new Date(
            placedAt.getTime() + prepMinutes * 60 * 1000
          ),
          actualReadyAt: new Date(
            placedAt.getTime() + (prepMinutes - 2) * 60 * 1000
          ),
          placedAt,
          statusHistory: makeStatusHistory(status, placedAt),
        });

        orderSequence += 1;
      }
    }

    await Order.insertMany(orderDocs);

    console.log('Creating party-order history for all 17 outlets...');

    const partyStatuses = ['confirmed', 'pending', 'confirmed', 'rejected'];
    const eventTypes = [
      'Birthday',
      'Wedding',
      'Corporate Event',
      'Anniversary',
      'Other',
    ];
    const foodPreferences = ['Veg', 'Non-Veg', 'Both'];

    const partyDocs = [];
    let partySequence = 1;

    for (let outletIndex = 0; outletIndex < outlets.length; outletIndex += 1) {
      const outlet = outlets[outletIndex];

      const eligibleCustomers = customers
        .map((customer) => ({
          customer,
          distance: distanceKm(
            getCoordinates(customer.address?.coordinates),
            getCoordinates(outlet.coordinates)
          ),
        }))
        .filter(
          ({ distance }) =>
            distance <= Number(outlet.deliveryRadius || 0)
        )
        .sort((a, b) => a.distance - b.distance);

      if (!eligibleCustomers.length) {
        throw new Error(
          `No deliverable customer found for party-order history at ${outlet.name}.`
        );
      }

      const customer =
        eligibleCustomers[outletIndex % eligibleCustomers.length].customer;

      const outletMenu = menuByOutlet.get(String(outlet._id));
      const firstItem = outletMenu[outletIndex % outletMenu.length];
      const secondItem = outletMenu[(outletIndex + 1) % outletMenu.length];

      const guestCount = 25 + ((outletIndex * 7) % 76);
      const status = partyStatuses[outletIndex % partyStatuses.length];

      const placedAt = new Date(
        Date.now() - (4 + outletIndex * 2) * 24 * 60 * 60 * 1000
      );

      const eventDateTime = new Date(
        Date.now() + (5 + (outletIndex % 12)) * 24 * 60 * 60 * 1000
      );

      const manager = staffByOutletId.get(String(outlet._id));

      const estimatedTotal =
        Number(firstItem.price) * Math.ceil(guestCount * 0.65) +
        Number(secondItem.price) * Math.ceil(guestCount * 0.35);

      const partyOrderId = `${DEMO_PARTY_PREFIX}${String(partySequence).padStart(4, '0')}`;

      const statusHistory = [
        {
          status: 'pending',
          timestamp: placedAt,
        },
      ];

      if (status === 'confirmed') {
        statusHistory.push({
          status: 'confirmed',
          timestamp: new Date(placedAt.getTime() + 3 * 60 * 60 * 1000),
          updatedBy: manager._id,
          note: 'Demo request reviewed and confirmed by the catering manager.',
        });
      } else if (status === 'rejected') {
        statusHistory.push({
          status: 'rejected',
          timestamp: new Date(placedAt.getTime() + 4 * 60 * 60 * 1000),
          updatedBy: manager._id,
          note: 'Demo request declined due to outlet capacity.',
        });
      }

      partyDocs.push({
        partyOrderId,
        customer: customer._id,
        outlet: outlet._id,
        eventType: eventTypes[outletIndex % eventTypes.length],
        eventDateTime,
        guestCount,
        foodPreference:
          foodPreferences[outletIndex % foodPreferences.length],
        items: [
          {
            menuItem: firstItem._id,
            name: firstItem.name,
            quantity: Math.ceil(guestCount * 0.65),
            unitPrice: Number(firstItem.price),
          },
          {
            menuItem: secondItem._id,
            name: secondItem.name,
            quantity: Math.ceil(guestCount * 0.35),
            unitPrice: Number(secondItem.price),
          },
        ],
        deliveryAddress: {
          street: `${customer.address.area}, Hyderabad`,
          area: customer.address.area,
          city: customer.address.city || 'Hyderabad',
          pincode: customer.address.pincode,
        },
        customerName: customer.name,
        contactNumber: customer.mobile,
        specialInstructions:
          'Demo party order for client handover and workflow testing.',
        additionalRequirements:
          'Please confirm final serving quantities with the customer.',
        status,
        statusHistory,
        ...(status !== 'pending'
          ? {
              reviewedBy: manager._id,
              reviewedAt: new Date(
                placedAt.getTime() +
                  (status === 'confirmed' ? 3 : 4) * 60 * 60 * 1000
              ),
            }
          : {}),
        ...(status === 'rejected'
          ? {
              rejectionReason:
                'The selected outlet is unavailable for this event slot.',
            }
          : {}),
        ...(status === 'confirmed'
          ? {
              managerRemarks:
                'Confirmed. The catering team will coordinate event details.',
            }
          : {}),
        estimatedTotal,
        placedAt,
      });

      partySequence += 1;
    }

    await PartyOrder.insertMany(partyDocs);

    console.log('Creating loyalty accounts and transaction histories...');

    for (const customer of customers) {
      const customerOrders = orderDocs.filter(
        (order) => String(order.customer) === String(customer._id)
      );

      const earnedTransactions = customerOrders.map((order) => ({
        type: 'earned',
        points: order.loyaltyPointsEarned,
        orderId: order.orderId,
        description: `Points earned from ${order.orderId}`,
        createdAt: order.placedAt,
      }));

      const totalEarned = earnedTransactions.reduce(
        (sum, transaction) => sum + transaction.points,
        0
      );

      const totalRedeemed = 0;

      await LoyaltyAccount.findOneAndUpdate(
        { user: customer._id },
        {
          $set: {
            totalEarned,
            totalRedeemed,
            currentBalance: totalEarned,
            transactions: earnedTransactions,
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );

      customer.loyaltyPoints = totalEarned;
      await customer.save();
    }

    const [
      outletCount,
      kitchenCount,
      cateringCount,
      customerCount,
      orderCount,
      partyCount,
    ] = await Promise.all([
      Outlet.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'kitchen' }),
      User.countDocuments({ role: 'catering_manager' }),
      User.countDocuments({
        mobile: { $in: demoCustomers.map((customer) => customer.mobile) },
      }),
      Order.countDocuments({
        orderId: { $regex: `^${DEMO_ORDER_PREFIX}` },
      }),
      PartyOrder.countDocuments({
        partyOrderId: { $regex: `^${DEMO_PARTY_PREFIX}` },
      }),
    ]);

    console.log('\nCompany A CLIENT DEMO DATA SEEDED');
    console.log(`Active outlets: ${outletCount}`);
    console.log(`Kitchen accounts in database: ${kitchenCount}`);
    console.log(`Catering manager accounts in database: ${cateringCount}`);
    console.log(`Demo customers: ${customerCount}`);
    console.log(`Demo historical orders: ${orderCount}`);
    console.log(`Demo party orders: ${partyCount}`);

    console.log('\nSTAFF LOGIN CREDENTIALS');
    console.log(`Kitchen password for all outlets: ${KITCHEN_PASSWORD}`);
    console.log(`Catering password for all outlets: ${CATERING_PASSWORD}`);

    console.log('\nCUSTOMER OTP DEMO NUMBERS');
    demoCustomers.forEach((customer) => {
      console.log(`${customer.name}: ${customer.mobile}`);
    });

    console.log('\nKitchen and catering emails:');
    outlets.forEach((outlet) => {
      console.log(
        `${outlet.name}: kitchen.${outlet.slug}@companya.in | catering.${outlet.slug}@companya.in`
      );
    });

    console.log(
      '\nOnly demo-prefixed orders and party orders are replaced when this script is rerun.'
    );
  } catch (error) {
    console.error('\nDemo data seed failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seed();
