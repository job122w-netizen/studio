'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Box, Gem, Shield, Zap } from 'lucide-react';
import type { TiendaItem } from "@/lib/placeholder-data";

type UserItem = {
    itemId: number;
    purchaseDate: string;
}

type InventoryProps = {
    userItems: UserItem[];
    allItems: TiendaItem[];
    onUseItem: (item: TiendaItem) => void;
};

const itemIcons: { [key: number]: React.ElementType } = {
    1: Gem,         // Gema de Enfoque
    4: Shield,      // Escudo Protector
    7: Box,         // Cofre Épico
    8: Box,         // Cofre Legendario
};
const itemIconColors: { [key: number]: string } = {
    1: 'text-purple-400',
    4: 'text-blue-400',
    7: 'text-purple-500',
    8: 'text-yellow-400',
};


export function Inventory({ userItems, allItems, onUseItem }: InventoryProps) {

    const ownedItemsDetails = userItems
        .map(ownedItem => {
            const itemDetails = allItems.find(i => i.id === ownedItem.itemId);
            return itemDetails ? { ...itemDetails, purchaseDate: ownedItem.purchaseDate } : null;
        })
        .filter(Boolean) as (TiendaItem & { purchaseDate: string })[];

    if (ownedItemsDetails.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-4">
                <p>Tu mochila está vacía.</p>
                <p className="text-xs">Los objetos que compres en la tienda aparecerán aquí.</p>
            </div>
        );
    }
    
    // Group items by ID
    const groupedItems: { [key: number]: { details: TiendaItem, count: number } } = {};
    for (const item of ownedItemsDetails) {
        if (groupedItems[item.id]) {
            groupedItems[item.id].count++;
        } else {
            groupedItems[item.id] = { details: item, count: 1 };
        }
    }

    return (
        <div className="space-y-3">
            {Object.values(groupedItems).map(({ details: item, count }) => {
                const Icon = itemIcons[item.id] || Zap;
                const canBeUsed = item.id === 1 || item.id === 7 || item.id === 8; // Focus Gem, Epic/Legendary Chest

                return (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-md bg-muted ${itemIconColors[item.id] || 'text-primary'}`}>
                                <Icon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-semibold">{item.name} {count > 1 && `(x${count})`}</p>
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                            </div>
                        </div>
                        {item.consumable && canBeUsed && (
                             <Button size="sm" variant="secondary" onClick={() => onUseItem(item)}>
                                Usar
                            </Button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
