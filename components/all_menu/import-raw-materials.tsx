"use client";

import { useMemo, useState } from "react";
import { PackageCheck, ReceiptText, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ManagerPhaseData, ManagerPurchaseOrderRow } from "@/lib/types/manager";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(value));
}

export function ImportRawMaterials({ data }: { data: ManagerPhaseData | null }) {
  const [orders, setOrders] = useState<ManagerPurchaseOrderRow[]>(data?.purchaseOrders ?? []);
  const [query, setQuery] = useState("");
  const [receivedQtyMap, setReceivedQtyMap] = useState<Record<string, number>>({});

  const matchedOrders = useMemo(
    () =>
      orders.filter((item) =>
        [item.poId, item.itemName, item.supplierName].some((value) =>
          value.toLowerCase().includes(query.toLowerCase())
        )
      ),
    [orders, query]
  );

  const arrivedOrders = useMemo(
    () => matchedOrders.filter((item) => item.status === "arrived"),
    [matchedOrders]
  );

  const receivedOrders = useMemo(
    () => matchedOrders.filter((item) => item.status === "received"),
    [matchedOrders]
  );

  const confirmReceive = (poId: string, receiveAll = false) => {
    const target = orders.find((item) => item.poId === poId);
    if (!target) return;

    const qty = receiveAll ? target.orderQty : receivedQtyMap[poId] ?? target.orderQty;

    setOrders((current) =>
      current.map((item) =>
        item.poId === poId
          ? {
              ...item,
              receivedQty: qty,
              status: "received",
            }
          : item
      )
    );
  };

  const confirmAllArrived = () => {
    setOrders((current) =>
      current.map((item) =>
        item.status === "arrived"
          ? {
              ...item,
              receivedQty: receivedQtyMap[item.poId] ?? item.orderQty,
              status: "received",
            }
          : item
      )
    );
  };

  if (!data) {
    return <section className="dashboard-panel rounded-2xl border p-6 text-sm text-slate-500">ยังไม่มีข้อมูลรับวัตถุดิบ</section>;
  }

  return (
    <section className="space-y-6">
      <Card className="dashboard-panel rounded-2xl border">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>รับวัตถุดิบเข้าคลัง</CardTitle>
            <CardDescription>ยืนยันปริมาณที่รับเข้าจาก PO ที่ของมาถึงแล้ว พร้อมค้นหาได้ทั้งในรายการรอรับและประวัติรับสินค้า</CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="ค้นหา PO / วัตถุดิบ / supplier" />
            </div>
            <Button onClick={confirmAllArrived} className="bg-sky-700 text-white hover:bg-sky-800">
              รับครบทั้งหมด
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="arrived" className="gap-6">
            <TabsList className="grid w-full grid-cols-2 bg-red-50/70">
              <TabsTrigger value="arrived" className="gap-2">
                <PackageCheck className="h-4 w-4" />
                รอยืนยันรับเข้า
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <ReceiptText className="h-4 w-4" />
                ประวัติรับสินค้า
              </TabsTrigger>
            </TabsList>

            <TabsContent value="arrived">
              <Table>
                <TableHeader className="bg-sky-50/70">
                  <TableRow>
                    <TableHead>เลขที่ PO</TableHead>
                    <TableHead>วัตถุดิบ</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>จำนวนสั่ง</TableHead>
                    <TableHead>จำนวนรับเข้า</TableHead>
                    <TableHead>กำหนดส่ง</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {arrivedOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">
                        ไม่มี PO ที่รอยืนยันรับเข้า
                      </TableCell>
                    </TableRow>
                  ) : (
                    arrivedOrders.map((item, index) => (
                      <TableRow key={`${item.poId}-${item.itemId}-${index}`} className="transition-colors hover:bg-sky-50/60">
                        <TableCell className="font-medium">{item.poId}</TableCell>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell>{item.supplierName}</TableCell>
                        <TableCell>{item.orderQty.toLocaleString("th-TH")} {item.unit}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={item.orderQty}
                            value={receivedQtyMap[item.poId] ?? item.orderQty}
                            onChange={(event) =>
                              setReceivedQtyMap((current) => ({
                                ...current,
                                [item.poId]: Number(event.target.value),
                              }))
                            }
                            className="w-28"
                          />
                        </TableCell>
                        <TableCell>{formatDate(item.deliveryDate)}</TableCell>
                        <TableCell className="text-right">
                          <Button onClick={() => confirmReceive(item.poId, false)} className="bg-emerald-700 text-white hover:bg-emerald-800">
                            ยืนยันรับเข้า
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="history">
              <Table>
                <TableHeader className="bg-emerald-50/70">
                  <TableRow>
                    <TableHead>เลขที่ PO</TableHead>
                    <TableHead>วัตถุดิบ</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>จำนวนสั่ง</TableHead>
                    <TableHead>จำนวนรับเข้า</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>วันที่รับเข้า</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivedOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">
                        ไม่มีประวัติรับสินค้าที่ตรงกับคำค้นหา
                      </TableCell>
                    </TableRow>
                  ) : (
                    receivedOrders.map((item, index) => (
                      <TableRow key={`${item.poId}-${item.receivedQty}-${index}`} className="transition-colors hover:bg-emerald-50/60">
                        <TableCell className="font-medium">{item.poId}</TableCell>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell>{item.supplierName}</TableCell>
                        <TableCell>{item.orderQty.toLocaleString("th-TH")} {item.unit}</TableCell>
                        <TableCell>{item.receivedQty.toLocaleString("th-TH")} {item.unit}</TableCell>
                        <TableCell>
                          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">รับเข้าคลังแล้ว</Badge>
                        </TableCell>
                        <TableCell>{formatDate(item.deliveryDate)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}
