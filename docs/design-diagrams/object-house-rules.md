# Object Diagram: House Rules

Captures a snapshot of the system at the moment a provider has finished adding house rules and published a listing.

```mermaid
classDiagram
    direction TB

    class listing_instance {
        <<object : room_listings>>
        id = "a1b2c3d4-..."
        title = "Downtown Studio near TTC"
        rental_fee = 1200
        status = "published"
        city = "Toronto"
        address = "123 Queen St W"
        house_rules = ["No smoking inside the unit", "No pets allowed", "Quiet hours after 10 PM"]
    }

    class formState_instance {
        <<object : CreateListingForm>>
        houseRules = ["No smoking inside the unit", "No pets allowed", "Quiet hours after 10 PM"]
        houseRuleInput = ""
        submitStatus = "published"
    }

    class hiddenInput_instance {
        <<object : hidden input>>
        name = "description"
        value = '["No smoking inside the unit","No pets allowed","Quiet hours after 10 PM"]'
    }

    class serverAction_instance {
        <<object : createListing action>>
        house_rules_raw = '["No smoking...", "No pets...", "Quiet hours..."]'
        house_rules = ["No smoking inside the unit", "No pets allowed", "Quiet hours after 10 PM"]
    }

    formState_instance --> hiddenInput_instance : serializes rules via JSON.stringify()
    hiddenInput_instance --> serverAction_instance : submitted via FormData
    serverAction_instance --> listing_instance : persisted to DB as text[]
```

## Notes

| Object | Role |
| :--- | :--- |
| `CreateListingForm` | Client-side React state — holds the rules array while the user builds the listing |
| `hidden input` | Bridge between React state and the HTML form — carries `JSON.stringify(houseRules)` |
| `createListing action` | Server Action that parses the JSON string back into `string[]` before writing to Supabase |
| `room_listings` | Final persisted state — `house_rules` stored as a native `text[]` PostgreSQL array |
