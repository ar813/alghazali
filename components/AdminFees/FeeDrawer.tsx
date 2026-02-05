"use client";

import React, { useState, useEffect } from 'react';
import {
    Save, Calendar, BookOpen, Hash,
    GraduationCap, Coins
} from 'lucide-react';
import type { Student } from '@/types/student';
import {
    Drawer,
    DrawerBody,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    VStack,
    Box,
    Text,
    SimpleGrid,
    Input,
    Select,
    Textarea,
    Button,
    InputGroup,
    InputLeftElement,
    FormControl,
    FormLabel,
    InputRightElement,
} from "@chakra-ui/react";

interface FeeDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: any;
    students: Student[];
    MONTHS: readonly string[];
    submitting: boolean;
}

const FeeDrawer = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    students,
    MONTHS,
    submitting
}: FeeDrawerProps) => {
    const [form, setForm] = useState({
        studentId: '',
        className: '',
        month: MONTHS[new Date().getMonth() + 1],
        year: new Date().getFullYear(),
        amountPaid: 0 as number | '',
        paidDate: new Date().toISOString().slice(0, 10),
        receiptNumber: '',
        bookNumber: '',
        notes: '',
    });

    const [studentQuickFilter, setStudentQuickFilter] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setForm({
                    studentId: initialData.student?._id || initialData.student?._ref || '',
                    className: initialData.className || '',
                    month: initialData.month,
                    year: initialData.year,
                    amountPaid: initialData.amountPaid ?? 0,
                    paidDate: initialData.paidDate || new Date().toISOString().slice(0, 10),
                    receiptNumber: initialData.receiptNumber || '',
                    bookNumber: initialData.bookNumber || '',
                    notes: initialData.notes || '',
                });
            } else {
                setForm({
                    studentId: '',
                    className: '',
                    month: MONTHS[new Date().getMonth() + 1],
                    year: new Date().getFullYear(),
                    amountPaid: 0,
                    paidDate: new Date().toISOString().slice(0, 10),
                    receiptNumber: '',
                    bookNumber: '',
                    notes: '',
                });
            }
            setStudentQuickFilter('');
        }
    }, [isOpen, initialData, MONTHS]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(form);
    };

    const filteredStudents = students.filter(s => {
        const q = studentQuickFilter.trim().toLowerCase();
        if (!q) return true;
        return (s.rollNumber || '').toLowerCase().includes(q) ||
            (s.grNumber || '').toLowerCase().includes(q) ||
            (s.fullName || '').toLowerCase().includes(q);
    }).slice(0, 50);

    return (
        <Drawer
            isOpen={isOpen}
            placement="right"
            onClose={onClose}
            size="md"
            closeOnOverlayClick={false}
            closeOnEsc={false}
        >
            <DrawerOverlay backdropFilter="blur(4px)" bg="blackAlpha.300" />
            <DrawerContent
                bg="white"
                borderLeft="1px"
                borderColor="zinc.200"
                shadow="2xl"
                _dark={{ bg: "zinc.900", borderColor: "zinc.800" }}
            >
                <DrawerCloseButton top="4" />

                <DrawerHeader borderBottomWidth="1px" py="4">
                    <Box>
                        <Text fontSize="lg" fontWeight="800" color="zinc.900" _dark={{ color: "white" }}>
                            {initialData ? 'Edit Fee Record' : 'Add New Fee'}
                        </Text>
                        <Text fontSize="xs" fontWeight="medium" color="zinc.500" mt="0.5">
                            {initialData ? 'Update details for this transaction.' : 'Record a new fee payment from a student.'}
                        </Text>
                    </Box>
                </DrawerHeader>

                <DrawerBody py="5">
                    <form id="fee-form" onSubmit={handleSubmit}>
                        <VStack spacing="5" align="stretch">
                            {/* Student Selection */}
                            <FormControl isRequired>
                                <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" color="zinc.500">
                                    Student
                                </FormLabel>
                                <InputGroup size="md" mb="2">
                                    <InputLeftElement pointerEvents="none">
                                        <Hash size={16} className="text-zinc-400" />
                                    </InputLeftElement>
                                    <Input
                                        value={studentQuickFilter}
                                        onChange={e => setStudentQuickFilter(e.target.value)}
                                        placeholder="Search by Name, Roll, or GR..."
                                        rounded="xl"
                                        fontSize="sm"
                                        bg="zinc.50"
                                        _dark={{ bg: "zinc.900/50" }}
                                    />
                                </InputGroup>
                                <Select
                                    value={form.studentId}
                                    onChange={e => {
                                        const s = students.find(st => st._id === e.target.value);
                                        setForm(prev => ({
                                            ...prev,
                                            studentId: e.target.value,
                                            className: s?.admissionFor || prev.className
                                        }));
                                    }}
                                    rounded="xl"
                                    fontSize="sm"
                                    placeholder="Select Student"
                                    className="dark:bg-zinc-900"
                                >
                                    {filteredStudents.map(s => (
                                        <option key={s._id} value={s._id}>
                                            {s.fullName} (Roll: {s.rollNumber}, GR: {s.grNumber})
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Class */}
                            <FormControl isRequired>
                                <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" color="zinc.500">
                                    Class
                                </FormLabel>
                                <InputGroup size="md">
                                    <InputLeftElement pointerEvents="none">
                                        <GraduationCap size={16} className="text-zinc-400" />
                                    </InputLeftElement>
                                    <Input
                                        value={form.className}
                                        onChange={e => setForm({ ...form, className: e.target.value })}
                                        rounded="xl"
                                        fontSize="sm"
                                        bg="zinc.50"
                                        _dark={{ bg: "zinc.900/50" }}
                                    />
                                </InputGroup>
                            </FormControl>

                            {/* Month & Year */}
                            <Box>
                                <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" color="zinc.500">
                                    Billing Period
                                </FormLabel>
                                <SimpleGrid columns={2} spacing="3">
                                    <Select
                                        value={form.month}
                                        onChange={e => setForm({ ...form, month: e.target.value })}
                                        rounded="xl"
                                        fontSize="sm"
                                    >
                                        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </Select>
                                    <Input
                                        type="number"
                                        value={form.year}
                                        onChange={e => setForm({ ...form, year: Number(e.target.value) })}
                                        rounded="xl"
                                        fontSize="sm"
                                    />
                                </SimpleGrid>
                            </Box>

                            {/* Amount */}
                            <FormControl isRequired>
                                <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" color="zinc.500">
                                    Amount Paid
                                </FormLabel>
                                <InputGroup size="lg">
                                    <InputLeftElement pointerEvents="none">
                                        <Coins size={18} className="text-emerald-500" />
                                    </InputLeftElement>
                                    <Input
                                        type="number"
                                        value={form.amountPaid}
                                        onChange={e => setForm({ ...form, amountPaid: e.target.value === '' ? '' : Number(e.target.value) })}
                                        rounded="xl"
                                        fontSize="md"
                                        fontWeight="bold"
                                        fontFamily="mono"
                                        bg="zinc.50"
                                        _dark={{ bg: "zinc.900/50" }}
                                    />
                                    <InputRightElement width="4.5rem">
                                        <Text fontSize="xs" fontWeight="bold" color="zinc.400">PKR</Text>
                                    </InputRightElement>
                                </InputGroup>
                                <Box display="flex" flexWrap="wrap" gap="2" mt="3">
                                    {[800, 1000, 1200, 1500, 2000].map(amt => (
                                        <Button
                                            key={amt}
                                            size="xs"
                                            variant="outline"
                                            onClick={() => setForm(prev => ({ ...prev, amountPaid: amt }))}
                                            rounded="md"
                                            _hover={{ bg: "zinc.50", _dark: { bg: "zinc.800" } }}
                                        >
                                            {amt}
                                        </Button>
                                    ))}
                                </Box>
                            </FormControl>

                            {/* Date */}
                            <FormControl isRequired>
                                <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" color="zinc.500">
                                    Payment Date
                                </FormLabel>
                                <InputGroup>
                                    <InputLeftElement pointerEvents="none">
                                        <Calendar size={16} className="text-zinc-400" />
                                    </InputLeftElement>
                                    <Input
                                        type="date"
                                        value={form.paidDate}
                                        onChange={e => setForm({ ...form, paidDate: e.target.value })}
                                        rounded="xl"
                                        fontSize="sm"
                                        className="font-mono"
                                    />
                                </InputGroup>
                            </FormControl>

                            {/* Receipt & Book */}
                            <SimpleGrid columns={2} spacing="4">
                                <FormControl isRequired>
                                    <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" color="zinc.500">
                                        Receipt No.
                                    </FormLabel>
                                    <InputGroup>
                                        <InputLeftElement pointerEvents="none">
                                            <Hash size={16} className="text-zinc-400" />
                                        </InputLeftElement>
                                        <Input
                                            value={form.receiptNumber}
                                            onChange={e => setForm({ ...form, receiptNumber: e.target.value })}
                                            rounded="xl"
                                            fontSize="sm"
                                            className="font-mono"
                                        />
                                    </InputGroup>
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" color="zinc.500">
                                        Book No.
                                    </FormLabel>
                                    <InputGroup>
                                        <InputLeftElement pointerEvents="none">
                                            <BookOpen size={16} className="text-zinc-400" />
                                        </InputLeftElement>
                                        <Input
                                            value={form.bookNumber}
                                            onChange={e => setForm({ ...form, bookNumber: e.target.value })}
                                            rounded="xl"
                                            fontSize="sm"
                                            className="font-mono"
                                        />
                                    </InputGroup>
                                </FormControl>
                            </SimpleGrid>

                            {/* Notes */}
                            <FormControl>
                                <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" color="zinc.500">
                                    Notes (Optional)
                                </FormLabel>
                                <Textarea
                                    value={form.notes}
                                    onChange={e => setForm({ ...form, notes: e.target.value })}
                                    rounded="xl"
                                    fontSize="sm"
                                    rows={3}
                                    resize="none"
                                />
                            </FormControl>
                        </VStack>
                    </form>
                </DrawerBody>

                <DrawerFooter borderTopWidth="1px" py="4">
                    <Button
                        variant="ghost"
                        mr={2}
                        onClick={onClose}
                        rounded="lg"
                        fontSize="xs"
                        fontWeight="bold"
                        size="sm"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="fee-form"
                        isLoading={submitting}
                        loadingText="Saving..."
                        bg="zinc.900"
                        color="white"
                        _hover={{ bg: "zinc.800" }}
                        _dark={{ bg: "white", color: "zinc.900", _hover: { bg: "zinc.100" } }}
                        rounded="lg"
                        px="6"
                        fontSize="xs"
                        fontWeight="bold"
                        size="sm"
                        leftIcon={!submitting ? <Save size={16} /> : undefined}
                    >
                        Save Transaction
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
};

export default FeeDrawer;
