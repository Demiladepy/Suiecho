module sui_echo::echo {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};

    // Errors
    const ENotCourseRep: u64 = 0;

    // Structs
    struct Handout has key, store {
        id: UID,
        blob_id: String,
        description: String,
        uploader: address,
        verified: bool 
    }

    struct CourseRepBroadcast has key, store {
        id: UID,
        course_code: String,
        audio_blob_id: String,
        message: String,
        verified_by: address, // The course rep
    }

    struct AlumniAjo has key {
        id: UID,
        pools: Table<String, Balance<SUI>>, // Course Code -> SUI Balance
    }

    fun init(ctx: &mut TxContext) {
        // Create the global Ajo pool
        transfer::share_object(AlumniAjo {
            id: object::new(ctx),
            pools: table::new(ctx),
        });
    }

    // --- Marketplace / Scan Logic ---
    public entry fun mint_handout(blob_id: vector<u8>, description: vector<u8>, ctx: &mut TxContext) {
        let handout = Handout {
            id: object::new(ctx),
            blob_id: string::utf8(blob_id),
            description: string::utf8(description),
            uploader: tx_context::sender(ctx),
            verified: false,
        };
        transfer::transfer(handout, tx_context::sender(ctx));
    }

    // --- Features: Course Rep Broadcast ---
    public entry fun broadcast(
        course_code: vector<u8>, 
        audio_blob_id: vector<u8>, 
        message: vector<u8>, 
        ctx: &mut TxContext
    ) {
        let broadcast = CourseRepBroadcast {
            id: object::new(ctx),
            course_code: string::utf8(course_code),
            audio_blob_id: string::utf8(audio_blob_id),
            message: string::utf8(message),
            verified_by: tx_context::sender(ctx),
        };
        transfer::transfer(broadcast, tx_context::sender(ctx));
    }

    // --- Features: Alumni Ajo ---
    public entry fun sponsor_course(
        ajo: &mut AlumniAjo, 
        course_code: vector<u8>, 
        payment: Coin<SUI>, 
        _ctx: &mut TxContext
    ) {
        let code_str = string::utf8(course_code);
        let balance = coin::into_balance(payment);

        if (table::contains(&ajo.pools, code_str)) {
            let pool = table::borrow_mut(&mut ajo.pools, code_str);
            balance::join(pool, balance);
        } else {
            table::add(&mut ajo.pools, code_str, balance);
        };
    }
}
