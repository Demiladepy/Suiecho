/// Sui-Echo Smart Contract
/// 
/// This module provides the core functionality for the Sui-Echo platform:
/// - Handout minting and verification
/// - Course rep broadcasts
/// - Alumni Ajo reward pools
/// - TEE-based verification authorization
/// - Course rep registration and verification

module sui_echo::echo {
    use std::string::{Self, String};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};
    use sui::event;
    use sui::dynamic_field;
    use sui::ed25519;

    // ========== Error Codes ==========
    // Authorization & Access Control
    const ENotAuthorized: u64 = 0;
    const ENotVerified: u64 = 1;
    const EAlreadyVerified: u64 = 2;
    const EInsufficientBalance: u64 = 3;
    const EInvalidInput: u64 = 4;
    const EPoolNotFound: u64 = 5;
    const EAlreadyRegistered: u64 = 6;
    const EInvalidSignature: u64 = 9;
    const ETeePubkeyNotSet: u64 = 10;

    // ========== Constants ==========
    const DEFAULT_REWARD_AMOUNT: u64 = 100_000_000; // 0.1 SUI
    const MIN_BLOB_ID_LENGTH: u64 = 10;

    // ========== Events ==========
    
    public struct HandoutMinted has copy, drop {
        id: object::ID,
        uploader: address,
        blob_id: String,
        timestamp: u64,
    }

    public struct HandoutVerified has copy, drop {
        id: object::ID,
        verified_by: address,
        verifier_type: String,
    }

    public struct RewardClaimed has copy, drop {
        handout_id: object::ID,
        recipient: address,
        amount: u64,
        course_code: String,
    }

    public struct BroadcastCreated has copy, drop {
        id: object::ID,
        course_code: String,
        broadcaster: address,
    }

    public struct CourseSponsored has copy, drop {
        course_code: String,
        sponsor: address,
        amount: u64,
    }

    public struct CourseRepApplicationSubmitted has copy, drop {
        application_id: object::ID,
        applicant: address,
        course_code: String,
        timestamp: u64,
    }

    public struct CourseRepApproved has copy, drop {
        rep_id: object::ID,
        applicant: address,
        course_code: String,
        approved_by: address,
    }

    public struct CourseRepRejected has copy, drop {
        application_id: object::ID,
        applicant: address,
        rejected_by: address,
        reason: String,
    }

    // ========== Capability Objects ==========

    /// Capability for Admin actions
    public struct AdminCap has key, store {
        id: UID,
    }

    /// Capability for TEE Verifiers
    public struct TeeVerifierCap has key, store {
        id: UID,
        name: String,
    }

    /// Capability for Course Representatives
    public struct CourseRepCap has key, store {
        id: UID,
        course_code: String,
        rep_address: address,
        verified_by: address,
        verified_at: u64,
    }

    // ========== Core Objects ==========

    /// Represents a student's uploaded note/handout
    public struct Handout has key, store {
        id: UID,
        blob_id: String,
        description: String,
        uploader: address,
        verified: bool,
        verified_by: address,
        created_at: u64,
    }

    /// Broadcast message from a course rep
    public struct CourseRepBroadcast has key, store {
        id: UID,
        course_code: String,
        audio_blob_id: String,
        message: String,
        broadcaster: address,
        created_at: u64,
    }

    /// Application to become a course rep
    public struct CourseRepApplication has key, store {
        id: UID,
        applicant: address,
        course_code: String,
        full_name: String,
        student_id: String,
        department: String,
        reason: String,
        created_at: u64,
    }

    /// Global shared object for reward pools
    public struct AlumniAjo has key {
        id: UID,
        pools: Table<String, Balance<SUI>>,
        reward_amount: u64,
        total_verified: u64,
        total_rewards_paid: u64,
    }

    /// Registry for course rep applications & verification
    public struct CourseRepRegistry has key {
        id: UID,
        pending_applications: Table<address, bool>,
        verified_reps: Table<address, String>,
    }

    /// TEE Configuration - stores the TEE verifier's public key
    public struct TeeConfig has key {
        id: UID,
        tee_pubkey: vector<u8>,
    }

    // ========== Initialization ==========

    /// Module initializer
    fun init(ctx: &mut TxContext) {
        // Create and transfer AdminCap to sender
        transfer::transfer(AdminCap {
            id: object::new(ctx),
        }, tx_context::sender(ctx));

        // Share the AlumniAjo reward pool object
        transfer::share_object(AlumniAjo {
            id: object::new(ctx),
            pools: table::new(ctx),
            reward_amount: DEFAULT_REWARD_AMOUNT,
            total_verified: 0,
            total_rewards_paid: 0,
        });

        // Share the CourseRepRegistry object
        transfer::share_object(CourseRepRegistry {
            id: object::new(ctx),
            pending_applications: table::new(ctx),
            verified_reps: table::new(ctx),
        });

        // Initialize TEE config with empty pubkey (admin must set it)
        transfer::share_object(TeeConfig {
            id: object::new(ctx),
            tee_pubkey: vector::empty(),
        });
    }

    // ========== Admin Functions ==========

    /// Admin creates a TEE verifier capability
    public fun create_tee_verifier(
        _admin: &AdminCap,
        name: vector<u8>,
        recipient: address,
        ctx: &mut TxContext
    ) {
        // Create a new TeeVerifierCap and transfer to recipient
        transfer::transfer(TeeVerifierCap {
            id: object::new(ctx),
            name: string::utf8(name),
        }, recipient);
    }

    /// Admin updates the reward amount
    public fun set_reward_amount(
        _admin: &AdminCap,
        ajo: &mut AlumniAjo,
        new_amount: u64,
        _ctx: &mut TxContext
    ) {
        // Update the reward amount in the global object
        ajo.reward_amount = new_amount;
    }

    /// Admin sets the TEE verifier's Ed25519 public key (32 bytes)
    public fun set_tee_pubkey(
        _admin: &AdminCap,
        tee_config: &mut TeeConfig,
        pubkey: vector<u8>,
        _ctx: &mut TxContext
    ) {
        // Ensure 32-byte key length for Ed25519
        assert!(vector::length(&pubkey) == 32, EInvalidInput);
        // Set the public key in the shared config object
        tee_config.tee_pubkey = pubkey;
    }

    // ========== Course Rep Registration ==========

    /// User submits an application to be a course rep
    public fun apply_for_course_rep(
        registry: &mut CourseRepRegistry,
        course_code: vector<u8>,
        full_name: vector<u8>,
        student_id: vector<u8>,
        department: vector<u8>,
        reason: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        // Ensure user hasn't already applied or verified
        assert!(!table::contains(&registry.verified_reps, sender), EAlreadyRegistered);
        assert!(!table::contains(&registry.pending_applications, sender), EAlreadyRegistered);

        let application_uid = object::new(ctx);
        let id = object::uid_to_inner(&application_uid);
        let code_str = string::utf8(course_code);
        let timestamp = tx_context::epoch_timestamp_ms(ctx);

        let application = CourseRepApplication {
            id: application_uid,
            applicant: sender,
            course_code: code_str,
            full_name: string::utf8(full_name),
            student_id: string::utf8(student_id),
            department: string::utf8(department),
            reason: string::utf8(reason),
            created_at: timestamp,
        };

        // Store in pending_applications table for easy lookup
        table::add(&mut registry.pending_applications, sender, true);
        
        // Store application object as dynamic field on registry (keyed by applicant address)
        dynamic_field::add(&mut registry.id, sender, application);

        event::emit(CourseRepApplicationSubmitted {
            application_id: id,
            applicant: sender,
            course_code: code_str,
            timestamp,
        });
    }

    /// Admin approves a course rep application by applicant address
    public fun approve_course_rep(
        _admin: &AdminCap,
        registry: &mut CourseRepRegistry,
        applicant: address,
        ctx: &mut TxContext
    ) {
        // Retrieve and remove application from dynamic fields
        assert!(dynamic_field::exists_(&registry.id, applicant), ENotAuthorized);
        let application: CourseRepApplication = dynamic_field::remove(&mut registry.id, applicant);
        
        // Destructure application to get details and delete the UID
        let CourseRepApplication { id, applicant: app_addr, course_code, full_name: _, student_id: _, department: _, reason: _, created_at: _ } = application;

        // Clean up pending status
        if (table::contains(&registry.pending_applications, app_addr)) {
            table::remove(&mut registry.pending_applications, app_addr);
        };

        // Add to verified reps list
        if (!table::contains(&registry.verified_reps, app_addr)) {
            table::add(&mut registry.verified_reps, app_addr, course_code);
        };

        let rep_cap_uid = object::new(ctx);
        let rep_id = object::uid_to_inner(&rep_cap_uid);
        let approver = tx_context::sender(ctx);

        // Create and transfer the CourseRepCap to the user
        let rep_cap = CourseRepCap {
            id: rep_cap_uid,
            course_code,
            rep_address: app_addr,
            verified_by: approver,
            verified_at: tx_context::epoch_timestamp_ms(ctx),
        };

        event::emit(CourseRepApproved {
            rep_id,
            applicant: app_addr,
            course_code,
            approved_by: approver,
        });

        transfer::transfer(rep_cap, app_addr);
        object::delete(id);
    }

    /// Admin rejects a course rep application by applicant address
    public fun reject_course_rep(
        _admin: &AdminCap,
        registry: &mut CourseRepRegistry,
        applicant: address,
        rejection_reason: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Retrieve and remove application
        assert!(dynamic_field::exists_(&registry.id, applicant), ENotAuthorized);
        let application: CourseRepApplication = dynamic_field::remove(&mut registry.id, applicant);
        
        // Destructure to cleanup UID
        let CourseRepApplication { id, applicant: app_addr, course_code: _, full_name: _, student_id: _, department: _, reason: _, created_at: _ } = application;

        // Clean up pending status
        if (table::contains(&registry.pending_applications, app_addr)) {
            table::remove(&mut registry.pending_applications, app_addr);
        };

        event::emit(CourseRepRejected {
            application_id: object::uid_to_inner(&id),
            applicant: app_addr,
            rejected_by: tx_context::sender(ctx),
            reason: string::utf8(rejection_reason),
        });

        object::delete(id);
    }

    /// Checks if an address is a verified course rep
    public fun is_course_rep(registry: &CourseRepRegistry, addr: address): bool {
        // efficient lookup in the verified_reps table
        table::contains(&registry.verified_reps, addr)
    }

    // ========== Handout Functions ==========

    /// User mints a new handout
    public fun mint_handout(
        blob_id: vector<u8>,
        description: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Validate input length
        assert!(vector::length(&blob_id) >= MIN_BLOB_ID_LENGTH, EInvalidInput);
        
        let handout_uid = object::new(ctx);
        let id = object::uid_to_inner(&handout_uid);
        let blob_id_str = string::utf8(blob_id);
        let sender = tx_context::sender(ctx);
        let timestamp = tx_context::epoch_timestamp_ms(ctx);

        let handout = Handout {
            id: handout_uid,
            blob_id: blob_id_str,
            description: string::utf8(description),
            uploader: sender,
            verified: false,
            verified_by: @0x0,
            created_at: timestamp,
        };

        event::emit(HandoutMinted { id, uploader: sender, blob_id: blob_id_str, timestamp });
        transfer::transfer(handout, sender);
    }

    /// TEE verifies a handout using capability
    public fun verify_handout_tee(
        _verifier: &TeeVerifierCap,
        handout: &mut Handout,
        ajo: &mut AlumniAjo,
        ctx: &mut TxContext
    ) {
        // Ensure not already verified to prevent double counting
        assert!(!handout.verified, EAlreadyVerified);

        // Update verification status and metadata
        handout.verified = true;
        handout.verified_by = tx_context::sender(ctx);
        ajo.total_verified = ajo.total_verified + 1;

        event::emit(HandoutVerified {
            id: object::uid_to_inner(&handout.id),
            verified_by: tx_context::sender(ctx),
            verifier_type: string::utf8(b"TEE"),
        });
    }

    /// Admin manually verifies a handout
    public fun verify_handout_admin(
        _admin: &AdminCap,
        handout: &mut Handout,
        ajo: &mut AlumniAjo,
        ctx: &mut TxContext
    ) {
        // Ensure not already verified
        assert!(!handout.verified, EAlreadyVerified);

        // Update verification details by admin
        handout.verified = true;
        handout.verified_by = tx_context::sender(ctx);
        ajo.total_verified = ajo.total_verified + 1;

        event::emit(HandoutVerified {
            id: object::uid_to_inner(&handout.id),
            verified_by: tx_context::sender(ctx),
            verifier_type: string::utf8(b"ADMIN"),
        });
    }

    /// Course rep verifies a handout
    public fun verify_handout_rep(
        rep: &CourseRepCap,
        handout: &mut Handout,
        ajo: &mut AlumniAjo,
        _ctx: &mut TxContext
    ) {
        // Ensure not already verified
        assert!(!handout.verified, EAlreadyVerified);

        // Update verification using rep's credentials
        handout.verified = true;
        handout.verified_by = rep.rep_address;
        ajo.total_verified = ajo.total_verified + 1;

        event::emit(HandoutVerified {
            id: object::uid_to_inner(&handout.id),
            verified_by: rep.rep_address,
            verifier_type: string::utf8(b"COURSE_REP"),
        });
    }

    /// Self-verification (for testing/dev)
    public fun verify_handout(handout: &mut Handout, ctx: &mut TxContext) {
        // Restrict to uploader only
        assert!(handout.uploader == tx_context::sender(ctx), ENotAuthorized);
        assert!(!handout.verified, EAlreadyVerified);
        
        // Mark verified without incrementing global stats (test mode)
        handout.verified = true;
        handout.verified_by = tx_context::sender(ctx);

        event::emit(HandoutVerified {
            id: object::uid_to_inner(&handout.id),
            verified_by: tx_context::sender(ctx),
            verifier_type: string::utf8(b"SELF"),
        });
    }

    /// Verify a handout using a TEE attestation signature
    /// The message should be: handout_id_bytes ++ blob_id_bytes (concatenated)
    /// Signature must be a valid Ed25519 signature from the registered TEE
    public fun verify_with_attestation(
        tee_config: &TeeConfig,
        handout: &mut Handout,
        ajo: &mut AlumniAjo,
        signature: vector<u8>,
        message: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Only the uploader can verify their own handout
        assert!(handout.uploader == tx_context::sender(ctx), ENotAuthorized);
        assert!(!handout.verified, EAlreadyVerified);

        // TEE pubkey must be configured
        let pubkey = &tee_config.tee_pubkey;
        assert!(vector::length(pubkey) == 32, ETeePubkeyNotSet);

        // Verify the TEE's Ed25519 signature against the message
        let is_valid = ed25519::ed25519_verify(&signature, pubkey, &message);
        assert!(is_valid, EInvalidSignature);

        // Mark as verified
        handout.verified = true;
        handout.verified_by = tx_context::sender(ctx);
        ajo.total_verified = ajo.total_verified + 1;

        event::emit(HandoutVerified {
            id: object::uid_to_inner(&handout.id),
            verified_by: tx_context::sender(ctx),
            verifier_type: string::utf8(b"TEE_ATTESTATION"),
        });
    }

    // ========== Reward Functions ==========

    /// User claims reward for a verified handout
    public fun claim_reward(
        ajo: &mut AlumniAjo,
        handout: &Handout,
        course_code: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Ensure handout is verified and pool exists
        assert!(handout.verified, ENotVerified);
        let code_str = string::utf8(course_code);
        assert!(table::contains(&ajo.pools, code_str), EPoolNotFound);
        
        let pool = table::borrow_mut(&mut ajo.pools, code_str);
        let reward_amount = ajo.reward_amount;
        
        // Check for sufficient funds in the pool
        assert!(balance::value(pool) >= reward_amount, EInsufficientBalance);
        
        // Split reward from pool and transfer to recipient
        let reward_balance = balance::split(pool, reward_amount);
        let reward_coin = coin::from_balance(reward_balance, ctx);
        ajo.total_rewards_paid = ajo.total_rewards_paid + reward_amount;

        event::emit(RewardClaimed {
            handout_id: object::uid_to_inner(&handout.id),
            recipient: handout.uploader,
            amount: reward_amount,
            course_code: code_str,
        });

        transfer::public_transfer(reward_coin, handout.uploader);
    }

    // ========== Broadcast Functions ==========

    /// Course rep sends a broadcast
    public fun broadcast_verified(
        rep: &CourseRepCap,
        audio_blob_id: vector<u8>,
        message: vector<u8>,
        ctx: &mut TxContext
    ) {
        let broadcast_uid = object::new(ctx);
        let id = object::uid_to_inner(&broadcast_uid);

        // Create broadcast object linked to the course rep
        let broadcast_obj = CourseRepBroadcast {
            id: broadcast_uid,
            course_code: rep.course_code,
            audio_blob_id: string::utf8(audio_blob_id),
            message: string::utf8(message),
            broadcaster: rep.rep_address,
            created_at: tx_context::epoch_timestamp_ms(ctx),
        };

        event::emit(BroadcastCreated { id, course_code: rep.course_code, broadcaster: rep.rep_address });
        transfer::transfer(broadcast_obj, rep.rep_address);
    }

    /// Anyone can broadcast (generic)
    public fun broadcast(
        course_code: vector<u8>,
        audio_blob_id: vector<u8>,
        message: vector<u8>,
        ctx: &mut TxContext
    ) {
        let broadcast_uid = object::new(ctx);
        let id = object::uid_to_inner(&broadcast_uid);
        let code_str = string::utf8(course_code);
        let sender = tx_context::sender(ctx);

        // Create a generic broadcast object from sender
        let broadcast_obj = CourseRepBroadcast {
            id: broadcast_uid,
            course_code: code_str,
            audio_blob_id: string::utf8(audio_blob_id),
            message: string::utf8(message),
            broadcaster: sender,
            created_at: tx_context::epoch_timestamp_ms(ctx),
        };

        event::emit(BroadcastCreated { id, course_code: code_str, broadcaster: sender });
        transfer::transfer(broadcast_obj, sender);
    }

    // ========== Sponsorship Functions ==========

    /// Anyone can donate SUI to a course pool
    public fun sponsor_course(
        ajo: &mut AlumniAjo,
        course_code: vector<u8>,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let code_str = string::utf8(course_code);
        let amount = coin::value(&payment);
        let bal = coin::into_balance(payment);

        // Add payment to existing pool or create new one
        if (table::contains(&ajo.pools, code_str)) {
            balance::join(table::borrow_mut(&mut ajo.pools, code_str), bal);
        } else {
            table::add(&mut ajo.pools, code_str, bal);
        };

        event::emit(CourseSponsored { course_code: code_str, sponsor: tx_context::sender(ctx), amount });
    }

    // ========== View Functions ==========

    /// Get balance of a specific course pool
    public fun get_pool_balance(ajo: &AlumniAjo, course_code: String): u64 {
        // Check availability in table before borrowing
        if (table::contains(&ajo.pools, course_code)) {
            balance::value(table::borrow(&ajo.pools, course_code))
        } else { 0 }
    }

    public fun get_total_verified(ajo: &AlumniAjo): u64 { 
        // Return total count of verified handouts
        ajo.total_verified 
    }

    public fun get_total_rewards_paid(ajo: &AlumniAjo): u64 { 
        // Return total amount of SUI paid out as rewards
        ajo.total_rewards_paid 
    }

    public fun get_reward_amount(ajo: &AlumniAjo): u64 { 
        // Return the current reward amount setting
        ajo.reward_amount 
    }

    public fun is_verified(handout: &Handout): bool { 
        // Check if a specific handout is verified
        handout.verified 
    }
}
